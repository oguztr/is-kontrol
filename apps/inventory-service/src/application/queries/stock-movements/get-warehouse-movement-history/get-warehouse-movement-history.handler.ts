import type { StockMovementEntity } from "../../../../domain/entities/stock-movement.entity";
import { StockBalanceErrors } from "../../../../domain/errors/stock-balance.errors";
import type { StockBalanceError } from "../../../../domain/errors/stock-balance.errors";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import type { IWarehouseRepository } from "../../../../domain/repositories/warehouse.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { GetWarehouseMovementHistoryQuery } from "./get-warehouse-movement-history.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class GetWarehouseMovementHistoryHandler {
  constructor(
    private readonly movements: IStockMovementRepository,
    private readonly warehouses: IWarehouseRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetWarehouseMovementHistoryQuery,
  ): Promise<Result<StockMovementEntity[], StockBalanceError>> {
    const warehouse = await this.warehouses.findById(query.warehouseId);
    if (!warehouse || !this.actor.allowsCompany(warehouse.companyId))
      return new Failure(
        StockBalanceErrors.warehouseNotFound(query.warehouseId),
      );
    return new Success(
      await this.movements.list({
        companyId: warehouse.companyId,
        warehouseId: query.warehouseId,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        limit: query.limit,
      }),
    );
  }
}
