import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import type { IStockBalanceRepository } from "../../../../domain/repositories/stock-balance.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { StockDocumentError } from "../../../../domain/errors/stock-document.errors";
import { StockDocumentErrors } from "../../../../domain/errors/stock-document.errors";
import { StockBalanceEntity } from "../../../../domain/entities/stock-balance.entity";
import type { DocumentType, StockDocumentEntity } from "../../../../domain/entities/stock-document.entity";
import type { StockMovementEntity } from "../../../../domain/entities/stock-movement.entity";
import { Decimal } from "../../../../domain/value-objects/decimal.vo";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { StockDocumentPostValidator } from "../stock-document-post.validator";
import { StockBalanceEventsPublisher } from "../stock-balance-events.publisher";
import type { BalanceChange } from "../stock-balance-events.publisher";
import { PostStockDocumentCommand } from "./post-stock-document.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

// Kesinleştirmede genel stock.document.posted event'ine ek olarak operasyon
// türüne özel event yayınlanır; tüketiciler tür bazında abone olabilir.
const EVENT_BY_TYPE: Record<DocumentType, string> = {
  PURCHASE: "stock.purchase.received",
  SALE: "stock.sale.shipped",
  TRANSFER: "stock.transfer.completed",
  ADJUSTMENT: "stock.adjustment.applied",
  ADJUSTMENT_OUT: "stock.adjustment.applied",
  RETURN_IN: "stock.return.received",
  RETURN_OUT: "stock.return.sent",
  PRODUCTION_IN: "stock.production.received",
  PRODUCTION_OUT: "stock.production.issued",
  OPENING: "stock.opening.created",
};

export class PostStockDocumentHandler {
  constructor(
    private readonly stockDocumentRepository: IStockDocumentRepository,
    private readonly stockMovementRepository: IStockMovementRepository,
    private readonly stockBalanceRepository: IStockBalanceRepository,
    private readonly postValidator: StockDocumentPostValidator,
    private readonly balanceEvents: StockBalanceEventsPublisher,
    private readonly eventPublisher: IEventPublisherPort,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: PostStockDocumentCommand,
  ): Promise<Result<void, StockDocumentError>> {
    const error = await this.unitOfWork.run<StockDocumentError | undefined>(
      async () => {
        // Belgeyi ilk iş olarak kilitle: aynı belgeye gelen paralel post isteği
        // ilk transaction bitince güncel POSTED durumunu görür ve tekrar uygulamaz.
        const document = await this.stockDocumentRepository.findByIdForUpdate(
          command.documentId,
        );
        if (!document || !this.actor.allowsCompany(document.companyId)) {
          return StockDocumentErrors.notFound(command.documentId);
        }

        if (document.status === "POSTED") {
          return StockDocumentErrors.alreadyPosted(command.documentId);
        }

        if (document.status === "CANCELLED") {
          return StockDocumentErrors.alreadyCancelled(command.documentId);
        }

        const movements = await this.stockMovementRepository.findByDocumentId(
          document.id,
        );
        if (movements.length === 0) {
          return StockDocumentErrors.hasNoLines(document.id);
        }

        // Taslak beklerken referanslar değişmiş olabilir; belge kesinleşmeden
        // önce baştan doğrulanır ve taban miktarlar yeniden hesaplanır.
        const validation = await this.postValidator.validate(
          document,
          movements,
        );
        if ("code" in validation) {
          return validation;
        }

        // SELECT FOR UPDATE olmayan bir satırı kilitleyemez. Bu nedenle tüm
        // depo-ürün anahtarlarını deterministik sırada advisory-lock ile
        // kilitleyerek hem mevcut hem de ilk kez oluşacak bakiyeleri koruyoruz.
        const balanceKeys = [
          ...new Set(
            movements.map(
              (movement) => `${movement.warehouseId}|${movement.productId}`,
            ),
          ),
        ].sort();
        for (const key of balanceKeys) {
          const [warehouseId, productId] = key.split("|");
          await this.stockBalanceRepository.lockWarehouseAndProduct(
            warehouseId,
            productId,
          );
        }

        // Aynı depo+ürün için ikinci bir açılış belgesi kesinleştirilemez.
        if (document.documentType === "OPENING") {
          for (const key of balanceKeys) {
            const [warehouseId, productId] = key.split("|");
            if (
              await this.stockMovementRepository.hasPostedOpening(
                warehouseId,
                productId,
              )
            ) {
              return StockDocumentErrors.openingAlreadyExists(
                productId,
                warehouseId,
              );
            }
          }
        }

        // Bakiyeler FOR UPDATE ile kilitlenerek okunur (eşzamanlı post'lar
        // birbirinin güncellemesini ezemez) ve hareket sırasına göre BELLEKTE
        // biriktirilir. DB'ye yazma, tüm satırlar hatasız doğrulandıktan sonra
        // yapılır: hata "return" ile döndüğünde transaction commit olacağı için
        // erken yazma kısmi güncelleme bırakırdı.
        const pending = new Map<
          string,
          {
            existing: StockBalanceEntity | null;
            qty: Decimal;
            cost: Decimal;
            lastMovementId: string;
          }
        >();
        // TRANSFER'de hedef depoya giriş, kullanıcı fiyatıyla değil kaynak
        // deponun ortalama maliyetiyle değerlenir (maliyet korunur).
        const transferCosts = new Map<string, Decimal>();

        for (const movement of movements) {
          const key = `${movement.warehouseId}|${movement.productId}`;
          let state = pending.get(key);
          if (!state) {
            const existing =
              await this.stockBalanceRepository.findByWarehouseAndProductForUpdate(
                movement.warehouseId,
                movement.productId,
              );
            state = {
              existing,
              qty: existing ? Decimal.from(existing.quantity) : Decimal.zero(),
              cost: existing
                ? Decimal.from(existing.averageCost)
                : Decimal.zero(),
              lastMovementId: movement.id,
            };
            pending.set(key, state);
          }

          const delta =
            validation.baseQuantities.get(movement.id) ??
            Decimal.from(movement.baseQuantity);

          if (movement.direction === "IN") {
            // Ağırlıklı ortalama maliyet (WAC), belge para biriminden
            // şirket para birimine kur ile çevrilerek hesaplanır.
            const movementPrice =
              document.documentType === "TRANSFER"
                ? (transferCosts.get(movement.productId) ??
                  Decimal.from(movement.unitPrice).multiply(
                    Decimal.from(movement.exchangeRate),
                  ))
                : Decimal.from(movement.unitPrice).multiply(
                    Decimal.from(movement.exchangeRate),
                  );
            const totalCurrentValue = state.qty.multiply(state.cost);
            const incomingValue = delta.multiply(movementPrice);
            const newQty = state.qty.add(delta);
            state.cost = newQty.isPositive
              ? totalCurrentValue.add(incomingValue).divide(newQty)
              : Decimal.zero();
            state.qty = newQty;
          } else {
            if (document.documentType === "TRANSFER") {
              transferCosts.set(movement.productId, state.cost);
            }
            if (delta.isGreaterThan(state.qty)) {
              return StockDocumentErrors.insufficientStock({
                productId: movement.productId,
                warehouseId: movement.warehouseId,
                requested: movement.baseQuantity,
                available: state.qty.toFixed(4),
              });
            }
            state.qty = state.qty.subtract(delta);
            // cost stays unchanged on OUT
          }
          state.lastMovementId = movement.id;
        }

        const balanceChanges: BalanceChange[] = [];
        for (const [key, state] of pending) {
          const [warehouseId, productId] = key.split("|");
          if (!state.qty.fits(18, 4) || !state.cost.fits(18, 4)) {
            return StockDocumentErrors.balanceOutOfRange(
              productId,
              warehouseId,
            );
          }
          await this.stockBalanceRepository.saveOrUpdate(
            new StockBalanceEntity({
              id: state.existing?.id ?? crypto.randomUUID(),
              companyId: document.companyId,
              warehouseId,
              productId,
              quantity: state.qty.toFixed(4),
              averageCost: state.cost.toFixed(4),
              lastMovementId: state.lastMovementId,
              version: state.existing?.version ?? 0,
              updatedAt: new Date(),
            }),
          );
          balanceChanges.push({
            companyId: document.companyId,
            documentId: document.id,
            warehouseId,
            productId,
            quantity: state.qty.toFixed(4),
            averageCost: state.cost.toFixed(4),
            previousQuantity: state.existing?.quantity ?? "0.0000",
            previousAverageCost: state.existing?.averageCost ?? "0.0000",
          });
        }

        await this.publishMovementEvents(document, movements, validation.baseQuantities);
        await this.balanceEvents.publishChanges(balanceChanges);

        document.post();
        await this.stockDocumentRepository.update(document);

        const payload = {
          documentId: document.id,
          documentType: document.documentType,
          companyId: document.companyId,
          occurredAt: new Date().toISOString(),
        };
        await this.eventPublisher.publish({
          aggregateType: "StockDocument",
          aggregateId: document.id,
          eventType: "stock.document.posted",
          payload,
        });
        await this.eventPublisher.publish({
          aggregateType: "StockDocument",
          aggregateId: document.id,
          eventType: EVENT_BY_TYPE[document.documentType],
          payload,
        });

        return undefined;
      },
    );
    return error ? new Failure(error) : new Success(undefined);
  }

  // TRANSFER'de her satır çifti tek stock.transferred üretir; diğer türlerde
  // hareket yönüne göre stock.increased / stock.decreased yayınlanır.
  private async publishMovementEvents(
    document: StockDocumentEntity,
    movements: StockMovementEntity[],
    baseQuantities: Map<string, Decimal>,
  ): Promise<void> {
    const quantityOf = (movement: StockMovementEntity): string =>
      (
        baseQuantities.get(movement.id) ?? Decimal.from(movement.baseQuantity)
      ).toFixed(4);

    if (document.documentType === "TRANSFER") {
      for (let index = 0; index + 1 < movements.length; index += 2) {
        const outgoing = movements[index];
        const incoming = movements[index + 1];
        await this.eventPublisher.publish({
          aggregateType: "StockMovement",
          aggregateId: outgoing.id,
          eventType: "stock.transferred",
          payload: {
            documentId: document.id,
            companyId: document.companyId,
            productId: outgoing.productId,
            fromWarehouseId: outgoing.warehouseId,
            toWarehouseId: incoming.warehouseId,
            quantity: quantityOf(outgoing),
            occurredAt: new Date().toISOString(),
          },
        });
      }
      return;
    }

    for (const movement of movements) {
      await this.eventPublisher.publish({
        aggregateType: "StockMovement",
        aggregateId: movement.id,
        eventType:
          movement.direction === "IN" ? "stock.increased" : "stock.decreased",
        payload: {
          documentId: document.id,
          companyId: document.companyId,
          productId: movement.productId,
          warehouseId: movement.warehouseId,
          quantity: quantityOf(movement),
          occurredAt: new Date().toISOString(),
        },
      });
    }
  }
}
