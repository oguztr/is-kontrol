import type { ProductUnitEntity } from "../../../../domain/entities/product-unit.entity";
import { ProductUnitErrors } from "../../../../domain/errors/product-unit.errors";
import type { ProductUnitError } from "../../../../domain/errors/product-unit.errors";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IProductUnitRepository } from "../../../../domain/repositories/product-unit.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { ListProductUnitsQuery } from "./list-product-units.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class ListProductUnitsHandler {
  constructor(
    private readonly products: IProductRepository,
    private readonly productUnits: IProductUnitRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: ListProductUnitsQuery,
  ): Promise<Result<ProductUnitEntity[], ProductUnitError>> {
    const product = await this.products.findById(query.productId);
    if (
      !product ||
      product.deletedAt ||
      !this.actor.allowsCompany(product.companyId)
    )
      return new Failure(ProductUnitErrors.productNotFound(query.productId));
    return new Success(await this.productUnits.listByProduct(query.productId));
  }
}
