import { StockBalanceErrors } from "../../../../domain/errors/stock-balance.errors";
import type { StockBalanceError } from "../../../../domain/errors/stock-balance.errors";
import type { IStockBalanceRepository } from "../../../../domain/repositories/stock-balance.repository.interface";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { StockBalanceQueryHandlerBase } from "../stock-balance-view.base";
import type { StockBalanceView } from "../stock-balance-view.base";
import { GetProductStockQuery } from "./get-product-stock.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export interface ProductStockSummary {
  productId: string;
  totalQuantity: string;
  totalValue: string;
  balances: StockBalanceView[];
}

export class GetProductStockHandler extends StockBalanceQueryHandlerBase {
  constructor(
    private readonly balances: IStockBalanceRepository,
    private readonly products: IProductRepository,
    private readonly actor: IActorContextPort,
  ) {
    super();
  }

  async execute(
    query: GetProductStockQuery,
  ): Promise<Result<ProductStockSummary, StockBalanceError>> {
    const product = await this.products.findById(query.productId);
    if (!product || !this.actor.allowsCompany(product.companyId))
      return new Failure(StockBalanceErrors.productNotFound(query.productId));
    const balances = await this.balances.listByProduct(query.productId);
    const totals = this.totals(balances);
    return new Success({
      productId: query.productId,
      totalQuantity: totals.quantity.toFixed(4),
      totalValue: totals.value.toFixed(4),
      balances: balances.map((balance) => this.toView(balance)),
    });
  }
}
