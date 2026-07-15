import type { ProductEntity } from "../../../../domain/entities/product.entity";
import { ProductErrors } from "../../../../domain/errors/product.errors";
import type { ProductError } from "../../../../domain/errors/product.errors";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { SearchProductsQuery } from "./search-products.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class SearchProductsHandler {
  constructor(
    private readonly products: IProductRepository,
    private readonly companies: ICompanyReferenceRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: SearchProductsQuery,
  ): Promise<Result<ProductEntity[], ProductError>> {
    if (!this.actor.allowsCompany(query.companyId))
      return new Failure(ProductErrors.companyNotFound(query.companyId));
    const company = await this.companies.findById(query.companyId);
    if (!company)
      return new Failure(ProductErrors.companyNotFound(query.companyId));
    return new Success(
      await this.products.list({
        companyId: query.companyId,
        search: query.term,
        isActive: query.isActive,
      }),
    );
  }
}
