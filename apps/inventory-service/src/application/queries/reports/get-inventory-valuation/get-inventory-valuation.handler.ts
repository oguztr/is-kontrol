import { StockBalanceErrors } from "../../../../domain/errors/stock-balance.errors";
import type { StockBalanceError } from "../../../../domain/errors/stock-balance.errors";
import type {
  IStockBalanceRepository,
  ProductValuationRow,
} from "../../../../domain/repositories/stock-balance.repository.interface";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IWarehouseRepository } from "../../../../domain/repositories/warehouse.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { Decimal } from "../../../../domain/value-objects/decimal.vo";
import { GetInventoryValuationQuery } from "./get-inventory-valuation.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export interface InventoryValuationReport {
  companyId: string;
  warehouseId: string | null;
  totalValue: string;
  rows: ProductValuationRow[];
}

/* Değerleme bakiye tablosundan türetilir; averageCost miktar ağırlıklı
 * ortalamadır. */
export class GetInventoryValuationHandler {
  constructor(
    private readonly balances: IStockBalanceRepository,
    private readonly warehouses: IWarehouseRepository,
    private readonly companies: ICompanyReferenceRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetInventoryValuationQuery,
  ): Promise<Result<InventoryValuationReport, StockBalanceError>> {
    if (!this.actor.allowsCompany(query.companyId))
      return new Failure(StockBalanceErrors.companyNotFound(query.companyId));
    const company = await this.companies.findById(query.companyId);
    if (!company)
      return new Failure(StockBalanceErrors.companyNotFound(query.companyId));
    if (query.warehouseId) {
      const warehouse = await this.warehouses.findById(query.warehouseId);
      if (!warehouse || warehouse.companyId !== query.companyId)
        return new Failure(
          StockBalanceErrors.warehouseNotFound(query.warehouseId),
        );
    }
    const rows = await this.balances.valuation(
      query.companyId,
      query.warehouseId,
    );
    const totalValue = rows.reduce(
      (acc, row) => acc.add(Decimal.from(row.totalValue)),
      Decimal.zero(),
    );
    return new Success({
      companyId: query.companyId,
      warehouseId: query.warehouseId ?? null,
      totalValue: totalValue.toFixed(4),
      rows,
    });
  }
}
