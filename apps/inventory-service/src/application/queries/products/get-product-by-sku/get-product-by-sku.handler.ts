import type { ProductEntity } from "../../../../domain/entities/product.entity";
import { ProductErrors } from "../../../../domain/errors/product.errors";
import type { ProductError } from "../../../../domain/errors/product.errors";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { GetProductBySkuQuery } from "./get-product-by-sku.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class GetProductBySkuHandler {
  constructor(
    private readonly products: IProductRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetProductBySkuQuery,
  ): Promise<Result<ProductEntity, ProductError>> {
    const product = await this.products.findBySku(query.companyId, query.sku);
    return product && this.actor.allowsCompany(product.companyId)
      ? new Success(product)
      : new Failure(ProductErrors.notFound(query.sku));
  }
}
