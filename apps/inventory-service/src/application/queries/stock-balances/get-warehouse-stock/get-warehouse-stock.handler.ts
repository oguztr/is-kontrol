import { StockBalanceErrors } from "../../../../domain/errors/stock-balance.errors";
import type { StockBalanceError } from "../../../../domain/errors/stock-balance.errors";
import type { IStockBalanceRepository } from "../../../../domain/repositories/stock-balance.repository.interface";
import type { IWarehouseRepository } from "../../../../domain/repositories/warehouse.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { StockBalanceQueryHandlerBase } from "../stock-balance-view.base";
import type { StockBalanceView } from "../stock-balance-view.base";
import { GetWarehouseStockQuery } from "./get-warehouse-stock.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export interface WarehouseStockSummary {
  warehouseId: string;
  totalValue: string;
  balances: StockBalanceView[];
}

export class GetWarehouseStockHandler extends StockBalanceQueryHandlerBase {
  constructor(
    private readonly balances: IStockBalanceRepository,
    private readonly warehouses: IWarehouseRepository,
    private readonly actor: IActorContextPort,
  ) {
    super();
  }

  async execute(
    query: GetWarehouseStockQuery,
  ): Promise<Result<WarehouseStockSummary, StockBalanceError>> {
    const warehouse = await this.warehouses.findById(query.warehouseId);
    if (!warehouse || !this.actor.allowsCompany(warehouse.companyId))
      return new Failure(
        StockBalanceErrors.warehouseNotFound(query.warehouseId),
      );
    const balances = await this.balances.listByWarehouse(query.warehouseId);
    return new Success({
      warehouseId: query.warehouseId,
      totalValue: this.totals(balances).value.toFixed(4),
      balances: balances.map((balance) => this.toView(balance)),
    });
  }
}
