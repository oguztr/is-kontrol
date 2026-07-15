import type { IProductRepository } from "../../../domain/repositories/product.repository.interface";
import type { IEventPublisherPort } from "../../ports/event-publisher.port";
import { Decimal } from "../../../domain/value-objects/decimal.vo";

/** Bakiyeyi değiştiren bir işlemin (kesinleştirme/iptal) tek anahtar etkisi. */
export interface BalanceChange {
  companyId: string;
  documentId: string;
  warehouseId: string;
  productId: string;
  quantity: string;
  averageCost: string;
  previousQuantity: string;
  previousAverageCost: string;
}

/* Bakiye değişimlerinden türeyen eventleri tek yerden yayınlar:
 * stock.balance.changed her değişimde; inventory.cost.changed ortalama maliyet
 * değiştiğinde; stock.level.below-minimum / above-maximum yeni miktar ürün
 * kartındaki eşikleri ihlal ettiğinde. Outbox'a yazıldığı için çağıran
 * transaction'ın içinde kullanılmalıdır. */
export class StockBalanceEventsPublisher {
  constructor(
    private readonly products: IProductRepository,
    private readonly publisher: IEventPublisherPort,
  ) {}

  async publishChanges(changes: BalanceChange[]): Promise<void> {
    for (const change of changes) {
      const base = {
        companyId: change.companyId,
        documentId: change.documentId,
        warehouseId: change.warehouseId,
        productId: change.productId,
        occurredAt: new Date().toISOString(),
      };

      await this.publish("stock.balance.changed", change.warehouseId, {
        ...base,
        quantity: change.quantity,
        averageCost: change.averageCost,
        previousQuantity: change.previousQuantity,
      });

      if (change.averageCost !== change.previousAverageCost) {
        await this.publish("inventory.cost.changed", change.warehouseId, {
          ...base,
          averageCost: change.averageCost,
          previousAverageCost: change.previousAverageCost,
        });
      }

      const product = await this.products.findById(change.productId);
      if (!product) continue;
      const quantity = Decimal.from(change.quantity);
      const minimum = Decimal.from(product.minStockLevel);
      if (minimum.isPositive && !quantity.isGreaterThan(minimum)) {
        await this.publish("stock.level.below-minimum", change.warehouseId, {
          ...base,
          quantity: change.quantity,
          minStockLevel: product.minStockLevel,
        });
      }
      if (
        product.maxStockLevel &&
        quantity.isGreaterThan(Decimal.from(product.maxStockLevel))
      ) {
        await this.publish("stock.level.above-maximum", change.warehouseId, {
          ...base,
          quantity: change.quantity,
          maxStockLevel: product.maxStockLevel,
        });
      }
    }
  }

  private async publish(
    eventType: string,
    aggregateId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.publisher.publish({
      aggregateType: "StockBalance",
      aggregateId,
      eventType,
      payload,
    });
  }
}
