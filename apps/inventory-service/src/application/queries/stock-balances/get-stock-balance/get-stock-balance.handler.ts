import { StockBalanceErrors } from "../../../../domain/errors/stock-balance.errors";
import type { StockBalanceError } from "../../../../domain/errors/stock-balance.errors";
import type { IStockBalanceRepository } from "../../../../domain/repositories/stock-balance.repository.interface";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IWarehouseRepository } from "../../../../domain/repositories/warehouse.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { StockBalanceQueryHandlerBase } from "../stock-balance-view.base";
import type { StockBalanceView } from "../stock-balance-view.base";
import { GetStockBalanceQuery } from "./get-stock-balance.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class GetStockBalanceHandler extends StockBalanceQueryHandlerBase {
  constructor(
    private readonly balances: IStockBalanceRepository,
    private readonly products: IProductRepository,
    private readonly warehouses: IWarehouseRepository,
    private readonly actor: IActorContextPort,
  ) {
    super();
  }

  async execute(
    query: GetStockBalanceQuery,
  ): Promise<Result<StockBalanceView, StockBalanceError>> {
    const warehouse = await this.warehouses.findById(query.warehouseId);
    if (!warehouse || !this.actor.allowsCompany(warehouse.companyId))
      return new Failure(
        StockBalanceErrors.warehouseNotFound(query.warehouseId),
      );
    const product = await this.products.findById(query.productId);
    if (!product || !this.actor.allowsCompany(product.companyId))
      return new Failure(StockBalanceErrors.productNotFound(query.productId));
    const balance = await this.balances.findByWarehouseAndProduct(
      query.warehouseId,
      query.productId,
    );
    return new Success(
      balance
        ? this.toView(balance)
        : {
            warehouseId: query.warehouseId,
            productId: query.productId,
            quantity: "0.0000",
            averageCost: "0.0000",
            totalValue: "0.0000",
            lastMovementId: null,
            updatedAt: null,
          },
    );
  }
}
