import type { StockBalanceEntity } from "../../../domain/entities/stock-balance.entity";
import { Decimal } from "../../../domain/value-objects/decimal.vo";

/** Anlık bakiye görünümü: hiç hareket görmemiş depo-ürün için sıfır döner. */
export interface StockBalanceView {
  warehouseId: string;
  productId: string;
  quantity: string;
  averageCost: string;
  totalValue: string;
  lastMovementId: string | null;
  updatedAt: Date | null;
}

/* Bakiye sorgularının ortak görünüm dönüşümleri. */
export abstract class StockBalanceQueryHandlerBase {
  protected toView(balance: StockBalanceEntity): StockBalanceView {
    return {
      warehouseId: balance.warehouseId,
      productId: balance.productId,
      quantity: balance.quantity,
      averageCost: balance.averageCost,
      totalValue: Decimal.from(balance.quantity)
        .multiply(Decimal.from(balance.averageCost))
        .toFixed(4),
      lastMovementId: balance.lastMovementId,
      updatedAt: balance.updatedAt,
    };
  }

  protected totals(balances: StockBalanceEntity[]): {
    quantity: Decimal;
    value: Decimal;
  } {
    return balances.reduce(
      (acc, balance) => {
        const quantity = Decimal.from(balance.quantity);
        return {
          quantity: acc.quantity.add(quantity),
          value: acc.value.add(
            quantity.multiply(Decimal.from(balance.averageCost)),
          ),
        };
      },
      { quantity: Decimal.zero(), value: Decimal.zero() },
    );
  }
}
