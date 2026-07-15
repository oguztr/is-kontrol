import type { ProductEntity } from "../../../../domain/entities/product.entity";
import { ProductErrors } from "../../../../domain/errors/product.errors";
import type { ProductError } from "../../../../domain/errors/product.errors";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { GetProductQuery } from "./get-product.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class GetProductHandler {
  constructor(
    private readonly products: IProductRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetProductQuery,
  ): Promise<Result<ProductEntity, ProductError>> {
    const product = await this.products.findById(query.id);
    return product && this.actor.allowsCompany(product.companyId)
      ? new Success(product)
      : new Failure(ProductErrors.notFound(query.id));
  }
}
