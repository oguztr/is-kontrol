import { StockBalanceErrors } from "../../../../domain/errors/stock-balance.errors";
import type { StockBalanceError } from "../../../../domain/errors/stock-balance.errors";
import type {
  IStockBalanceRepository,
  StockLevelBreach,
} from "../../../../domain/repositories/stock-balance.repository.interface";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { GetLowStockProductsQuery } from "./get-low-stock-products.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class GetLowStockProductsHandler {
  constructor(
    private readonly balances: IStockBalanceRepository,
    private readonly companies: ICompanyReferenceRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetLowStockProductsQuery,
  ): Promise<Result<StockLevelBreach[], StockBalanceError>> {
    if (!this.actor.allowsCompany(query.companyId))
      return new Failure(StockBalanceErrors.companyNotFound(query.companyId));
    const company = await this.companies.findById(query.companyId);
    if (!company)
      return new Failure(StockBalanceErrors.companyNotFound(query.companyId));
    return new Success(await this.balances.listBelowMinimum(query.companyId));
  }
}
