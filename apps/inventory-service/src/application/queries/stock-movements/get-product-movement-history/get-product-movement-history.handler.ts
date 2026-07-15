import type { StockMovementEntity } from "../../../../domain/entities/stock-movement.entity";
import { StockBalanceErrors } from "../../../../domain/errors/stock-balance.errors";
import type { StockBalanceError } from "../../../../domain/errors/stock-balance.errors";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { GetProductMovementHistoryQuery } from "./get-product-movement-history.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class GetProductMovementHistoryHandler {
  constructor(
    private readonly movements: IStockMovementRepository,
    private readonly products: IProductRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetProductMovementHistoryQuery,
  ): Promise<Result<StockMovementEntity[], StockBalanceError>> {
    const product = await this.products.findById(query.productId);
    if (!product || !this.actor.allowsCompany(product.companyId))
      return new Failure(StockBalanceErrors.productNotFound(query.productId));
    return new Success(
      await this.movements.list({
        companyId: product.companyId,
        productId: query.productId,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        limit: query.limit,
      }),
    );
  }
}
