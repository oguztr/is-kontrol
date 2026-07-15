import { StockBalanceErrors } from "../../../../domain/errors/stock-balance.errors";
import type { StockBalanceError } from "../../../../domain/errors/stock-balance.errors";
import type { IStockBalanceRepository } from "../../../../domain/repositories/stock-balance.repository.interface";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { StockBalanceQueryHandlerBase } from "../stock-balance-view.base";
import type { StockBalanceView } from "../stock-balance-view.base";
import { GetNegativeStockProductsQuery } from "./get-negative-stock-products.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class GetNegativeStockProductsHandler extends StockBalanceQueryHandlerBase {
  constructor(
    private readonly balances: IStockBalanceRepository,
    private readonly companies: ICompanyReferenceRepository,
    private readonly actor: IActorContextPort,
  ) {
    super();
  }

  async execute(
    query: GetNegativeStockProductsQuery,
  ): Promise<Result<StockBalanceView[], StockBalanceError>> {
    if (!this.actor.allowsCompany(query.companyId))
      return new Failure(StockBalanceErrors.companyNotFound(query.companyId));
    const company = await this.companies.findById(query.companyId);
    if (!company)
      return new Failure(StockBalanceErrors.companyNotFound(query.companyId));
    return new Success(
      (await this.balances.listNegative(query.companyId)).map((balance) =>
        this.toView(balance),
      ),
    );
  }
}
