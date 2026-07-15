import type { ProductCategoryEntity } from "../../../../domain/entities/product-category.entity";
import { ProductCategoryErrors } from "../../../../domain/errors/product-category.errors";
import type { ProductCategoryError } from "../../../../domain/errors/product-category.errors";
import type { IProductCategoryRepository } from "../../../../domain/repositories/product-category.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { GetProductCategoryQuery } from "./get-product-category.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class GetProductCategoryHandler {
  constructor(
    private readonly categories: IProductCategoryRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetProductCategoryQuery,
  ): Promise<Result<ProductCategoryEntity, ProductCategoryError>> {
    const category = await this.categories.findById(query.id);
    return category && this.actor.allowsCompany(category.companyId)
      ? new Success(category)
      : new Failure(ProductCategoryErrors.notFound(query.id));
  }
}
