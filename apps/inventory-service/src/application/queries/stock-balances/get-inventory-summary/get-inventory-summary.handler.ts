import { StockBalanceErrors } from "../../../../domain/errors/stock-balance.errors";
import type { StockBalanceError } from "../../../../domain/errors/stock-balance.errors";
import type {
  CompanyStockTotals,
  IStockBalanceRepository,
} from "../../../../domain/repositories/stock-balance.repository.interface";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { GetInventorySummaryQuery } from "./get-inventory-summary.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

/** Şirket geneli envanter özeti: toplamlar + uyarı sayıları. */
export interface InventorySummary {
  companyId: string;
  totals: CompanyStockTotals;
  alerts: {
    belowMinimum: number;
    aboveMaximum: number;
    outOfStock: number;
    negative: number;
  };
}

export class GetInventorySummaryHandler {
  constructor(
    private readonly balances: IStockBalanceRepository,
    private readonly companies: ICompanyReferenceRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetInventorySummaryQuery,
  ): Promise<Result<InventorySummary, StockBalanceError>> {
    if (!this.actor.allowsCompany(query.companyId))
      return new Failure(StockBalanceErrors.companyNotFound(query.companyId));
    const company = await this.companies.findById(query.companyId);
    if (!company)
      return new Failure(StockBalanceErrors.companyNotFound(query.companyId));
    const [totals, belowMinimum, aboveMaximum, outOfStock, negative] =
      await Promise.all([
        this.balances.companySummary(query.companyId),
        this.balances.listBelowMinimum(query.companyId),
        this.balances.listAboveMaximum(query.companyId),
        this.balances.listOutOfStockProducts(query.companyId),
        this.balances.listNegative(query.companyId),
      ]);
    return new Success({
      companyId: query.companyId,
      totals,
      alerts: {
        belowMinimum: belowMinimum.length,
        aboveMaximum: aboveMaximum.length,
        outOfStock: outOfStock.length,
        negative: negative.length,
      },
    });
  }
}
