import type { StockMovementEntity } from "../../../../domain/entities/stock-movement.entity";
import { StockBalanceErrors } from "../../../../domain/errors/stock-balance.errors";
import type { StockBalanceError } from "../../../../domain/errors/stock-balance.errors";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IWarehouseRepository } from "../../../../domain/repositories/warehouse.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { Decimal } from "../../../../domain/value-objects/decimal.vo";
import { GetStockCardQuery } from "./get-stock-card.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

/** Stok kartı satırı: kesinleşmiş hareket + sonrasındaki yürüyen bakiye. */
export interface StockCardLine {
  movementId: string;
  documentId: string;
  date: Date;
  direction: "IN" | "OUT";
  warehouseId: string;
  baseQuantity: string;
  unitPrice: string;
  totalAmountBaseCurrency: string;
  balanceAfter: string;
}

export interface StockCardReport {
  productId: string;
  warehouseId: string | null;
  openingBalance: string;
  closingBalance: string;
  lines: StockCardLine[];
}

/* Stok kartı yalnız POSTED belgelerin hareketlerinden üretilir; taslakların
 * hareketleri rapora girmez. */
export class GetStockCardHandler {
  constructor(
    private readonly movements: IStockMovementRepository,
    private readonly products: IProductRepository,
    private readonly warehouses: IWarehouseRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetStockCardQuery,
  ): Promise<Result<StockCardReport, StockBalanceError>> {
    const product = await this.products.findById(query.productId);
    if (!product || !this.actor.allowsCompany(product.companyId))
      return new Failure(StockBalanceErrors.productNotFound(query.productId));
    if (query.warehouseId) {
      const warehouse = await this.warehouses.findById(query.warehouseId);
      if (!warehouse || warehouse.companyId !== product.companyId)
        return new Failure(
          StockBalanceErrors.warehouseNotFound(query.warehouseId),
        );
    }

    // Tarih aralığı verildiyse yürüyen bakiye, aralık öncesi kesinleşmiş
    // hareketlerin net toplamından başlar.
    let opening = Decimal.zero();
    if (query.dateFrom) {
      const prior = await this.movements.list({
        companyId: product.companyId,
        productId: query.productId,
        warehouseId: query.warehouseId,
        documentStatus: "POSTED",
        dateTo: new Date(query.dateFrom.getTime() - 1),
      });
      opening = prior.reduce(
        (acc, movement) => acc.add(this.signedQuantity(movement)),
        Decimal.zero(),
      );
    }

    const movements = await this.movements.list({
      companyId: product.companyId,
      productId: query.productId,
      warehouseId: query.warehouseId,
      documentStatus: "POSTED",
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
    // list() en yeni hareketi önce döndürür; stok kartı kronolojik ilerler.
    const chronological = [...movements].reverse();

    let running = opening;
    const lines: StockCardLine[] = chronological.map((movement) => {
      running = running.add(this.signedQuantity(movement));
      return {
        movementId: movement.id,
        documentId: movement.documentId,
        date: movement.createdAt,
        direction: movement.direction,
        warehouseId: movement.warehouseId,
        baseQuantity: movement.baseQuantity,
        unitPrice: movement.unitPrice,
        totalAmountBaseCurrency: movement.totalAmountBaseCurrency,
        balanceAfter: running.toFixed(4),
      };
    });

    return new Success({
      productId: query.productId,
      warehouseId: query.warehouseId ?? null,
      openingBalance: opening.toFixed(4),
      closingBalance: running.toFixed(4),
      lines,
    });
  }

  private signedQuantity(movement: StockMovementEntity): Decimal {
    const quantity = Decimal.from(movement.baseQuantity);
    return movement.direction === "IN"
      ? quantity
      : Decimal.zero().subtract(quantity);
  }
}
