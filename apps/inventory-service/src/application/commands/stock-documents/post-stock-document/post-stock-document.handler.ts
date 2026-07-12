import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import type { IStockBalanceRepository } from "../../../../domain/repositories/stock-balance.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { StockDocumentError } from "../../../../domain/errors/stock-document.errors";
import { StockDocumentErrors } from "../../../../domain/errors/stock-document.errors";
import { StockBalanceEntity } from "../../../../domain/entities/stock-balance.entity";
import { Decimal } from "../../../../domain/value-objects/decimal.vo";
import { PostStockDocumentCommand } from "./post-stock-document.command";

export class PostStockDocumentHandler {
  constructor(
    private readonly stockDocumentRepository: IStockDocumentRepository,
    private readonly stockMovementRepository: IStockMovementRepository,
    private readonly stockBalanceRepository: IStockBalanceRepository,
    private readonly eventPublisher: IEventPublisherPort,
    private readonly unitOfWork: IUnitOfWorkPort,
  ) {}

  async execute(
    command: PostStockDocumentCommand,
  ): Promise<StockDocumentError | undefined> {
    return this.unitOfWork.run<StockDocumentError | undefined>(async () => {
      // Belgeyi ilk iş olarak kilitle: aynı belgeye gelen paralel post isteği
      // ilk transaction bitince güncel POSTED durumunu görür ve tekrar uygulamaz.
      const document = await this.stockDocumentRepository.findByIdForUpdate(
        command.documentId,
      );
      if (!document) {
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

      // Bakiyeler FOR UPDATE ile kilitlenerek okunur (eşzamanlı post'lar
      // birbirinin güncellemesini ezemez) ve hareket sırasına göre BELLEKTE
      // biriktirilir. DB'ye yazma, tüm satırlar hatasız doğrulandıktan sonra
      // yapılır: hata "return" ile döndüğünde transaction commit olacağı için
      // erken yazma kısmi güncelleme bırakırdı.
      const pending = new Map<
        string,
        { existing: StockBalanceEntity | null; qty: Decimal; cost: Decimal; lastMovementId: string }
      >();

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
            cost: existing ? Decimal.from(existing.averageCost) : Decimal.zero(),
            lastMovementId: movement.id,
          };
          pending.set(key, state);
        }

        const delta = Decimal.from(movement.baseQuantity);

        if (movement.direction === "IN") {
          // Ağırlıklı ortalama maliyet (WAC), belge para biriminden
          // şirket para birimine kur ile çevrilerek hesaplanır.
          const movementPrice = Decimal.from(movement.unitPrice).multiply(
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

      for (const [key, state] of pending) {
        const [warehouseId, productId] = key.split("|");
        if (!state.qty.fits(18, 4) || !state.cost.fits(18, 4)) {
          return StockDocumentErrors.balanceOutOfRange(productId, warehouseId);
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
            updatedAt: new Date(),
          }),
        );
      }

      document.post();
      await this.stockDocumentRepository.update(document);

      await this.eventPublisher.publish({
        aggregateType: "StockDocument",
        aggregateId: document.id,
        eventType: "stock.document.posted",
        payload: {
          documentId: document.id,
          documentType: document.documentType,
          companyId: document.companyId,
          occurredAt: new Date().toISOString(),
        },
      });

      return undefined;
    });
  }
}
