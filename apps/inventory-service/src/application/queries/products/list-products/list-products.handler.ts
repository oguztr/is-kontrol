import type { ProductEntity } from "../../../../domain/entities/product.entity";
import { ProductErrors } from "../../../../domain/errors/product.errors";
import type { ProductError } from "../../../../domain/errors/product.errors";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IProductDependencyRepository } from "../../../../domain/repositories/product-dependency.repository.interface";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { ListProductsQuery } from "./list-products.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class ListProductsHandler {
  constructor(
    private readonly products: IProductRepository,
    private readonly dependencies: IProductDependencyRepository,
    private readonly companies: ICompanyReferenceRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: ListProductsQuery,
  ): Promise<Result<ProductEntity[], ProductError>> {
    // Şirket izolasyonu: kapsam dışı companyId ile listeleme reddedilir.
    if (!this.actor.allowsCompany(query.companyId))
      return new Failure(ProductErrors.companyNotFound(query.companyId));
    const company = await this.companies.findById(query.companyId);
    if (!company)
      return new Failure(ProductErrors.companyNotFound(query.companyId));
    if (
      query.categoryId &&
      !(await this.dependencies.categoryBelongsToCompany(
        query.categoryId,
        query.companyId,
      ))
    ) {
      return new Failure(ProductErrors.categoryNotFound(query.categoryId));
    }
    return new Success(
      await this.products.list({
        companyId: query.companyId,
        categoryId: query.categoryId,
        isActive: query.isActive,
        isArchived: query.isArchived,
        name: query.name,
      }),
    );
  }
}
