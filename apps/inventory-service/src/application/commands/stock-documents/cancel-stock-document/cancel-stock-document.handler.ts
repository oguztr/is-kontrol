import { StockBalanceEntity } from "../../../../domain/entities/stock-balance.entity";
import type { StockDocumentEntity } from "../../../../domain/entities/stock-document.entity";
import { StockDocumentErrors } from "../../../../domain/errors/stock-document.errors";
import type { StockDocumentError } from "../../../../domain/errors/stock-document.errors";
import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import type { IStockBalanceRepository } from "../../../../domain/repositories/stock-balance.repository.interface";
import { Decimal } from "../../../../domain/value-objects/decimal.vo";
import { StockBalanceEventsPublisher } from "../stock-balance-events.publisher";
import type { BalanceChange } from "../stock-balance-events.publisher";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { CancelStockDocumentCommand } from "./cancel-stock-document.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

/* İptal: taslak doğrudan iptal edilir; kesinleşmiş belgede bakiyelere
 * uygulanan hareketler ters yönde geri alınır. IN geri çekilirken stok
 * değeri hareket fiyatı üzerinden düşülerek ortalama maliyet yeniden
 * hesaplanır; OUT geri eklenirken mevcut ortalama maliyet korunur. */
export class CancelStockDocumentHandler {
  constructor(
    private readonly documents: IStockDocumentRepository,
    private readonly movements: IStockMovementRepository,
    private readonly balances: IStockBalanceRepository,
    private readonly balanceEvents: StockBalanceEventsPublisher,
    private readonly publisher: IEventPublisherPort,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: CancelStockDocumentCommand,
  ): Promise<Result<void, StockDocumentError>> {
    const error = await this.unitOfWork.run<StockDocumentError | undefined>(
      async () => {
        const document = await this.documents.findByIdForUpdate(command.id);
        if (!document || !this.actor.allowsCompany(document.companyId))
          return StockDocumentErrors.notFound(command.id);
        if (document.status === "CANCELLED")
          return StockDocumentErrors.alreadyCancelled(command.id);
        if (document.status === "POSTED") {
          const reversalError = await this.reverseBalances(document);
          if (reversalError) return reversalError;
        }
        document.cancel();
        await this.documents.update(document);
        await this.publisher.publish({
          aggregateType: "StockDocument",
          aggregateId: document.id,
          eventType: "stock.document.cancelled",
          payload: {
            documentId: document.id,
            documentType: document.documentType,
            companyId: document.companyId,
            occurredAt: new Date().toISOString(),
          },
        });
        return undefined;
      },
    );
    return error ? new Failure(error) : new Success(undefined);
  }

  private async reverseBalances(
    document: StockDocumentEntity,
  ): Promise<StockDocumentError | undefined> {
    const movements = await this.movements.findByDocumentId(document.id);
    const balanceKeys = [
      ...new Set(
        movements.map(
          (movement) => `${movement.warehouseId}|${movement.productId}`,
        ),
      ),
    ].sort();
    for (const key of balanceKeys) {
      const [warehouseId, productId] = key.split("|");
      await this.balances.lockWarehouseAndProduct(warehouseId, productId);
    }

    const pending = new Map<
      string,
      {
        existing: StockBalanceEntity | null;
        qty: Decimal;
        cost: Decimal;
        lastMovementId: string;
      }
    >();

    for (const movement of movements) {
      const key = `${movement.warehouseId}|${movement.productId}`;
      let state = pending.get(key);
      if (!state) {
        const existing =
          await this.balances.findByWarehouseAndProductForUpdate(
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
        if (delta.isGreaterThan(state.qty)) {
          return StockDocumentErrors.insufficientStock({
            productId: movement.productId,
            warehouseId: movement.warehouseId,
            requested: movement.baseQuantity,
            available: state.qty.toFixed(4),
          });
        }
        // Girişin katkısı hareket fiyatıyla değerden düşülür; kalan stok
        // sıfırsa (veya değer negatife saparsa) ortalama maliyet sıfırlanır.
        const movementPrice = Decimal.from(movement.unitPrice).multiply(
          Decimal.from(movement.exchangeRate),
        );
        const remainingValue = state.qty
          .multiply(state.cost)
          .subtract(delta.multiply(movementPrice));
        state.qty = state.qty.subtract(delta);
        state.cost =
          state.qty.isPositive && remainingValue.isPositive
            ? remainingValue.divide(state.qty)
            : Decimal.zero();
      } else {
        state.qty = state.qty.add(delta);
      }
      state.lastMovementId = movement.id;
    }

    const balanceChanges: BalanceChange[] = [];
    for (const [key, state] of pending) {
      const [warehouseId, productId] = key.split("|");
      if (!state.qty.fits(18, 4) || !state.cost.fits(18, 4)) {
        return StockDocumentErrors.balanceOutOfRange(productId, warehouseId);
      }
      await this.balances.saveOrUpdate(
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
    await this.balanceEvents.publishChanges(balanceChanges);
    return undefined;
  }
}
