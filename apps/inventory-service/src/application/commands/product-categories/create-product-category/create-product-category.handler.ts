import { ProductCategoryEntity } from "../../../../domain/entities/product-category.entity";
import { ProductCategoryErrors } from "../../../../domain/errors/product-category.errors";
import type { ProductCategoryError } from "../../../../domain/errors/product-category.errors";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IProductCategoryRepository } from "../../../../domain/repositories/product-category.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { CreateProductCategoryCommand } from "./create-product-category.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class CreateProductCategoryHandler {
  constructor(
    private readonly categories: IProductCategoryRepository,
    private readonly companies: ICompanyReferenceRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: CreateProductCategoryCommand,
  ): Promise<Result<{ id: string }, ProductCategoryError>> {
    const outcome = await this.unitOfWork.run<
      { id: string } | ProductCategoryError
    >(async () => {
      if (!this.actor.allowsCompany(command.companyId))
        return ProductCategoryErrors.companyNotFound(command.companyId);
      const company = await this.companies.findById(command.companyId);
      if (!company)
        return ProductCategoryErrors.companyNotFound(command.companyId);
      if (!company.isActive)
        return ProductCategoryErrors.companyInactive(command.companyId);
      await this.categories.lockCompanyGraph(command.companyId);
      if (command.parentId) {
        const parent = await this.categories.findById(command.parentId);
        if (!parent || parent.companyId !== command.companyId)
          return ProductCategoryErrors.notFound(command.parentId);
      }
      const category = new ProductCategoryEntity(
        crypto.randomUUID(),
        command.companyId,
        command.parentId,
        command.name,
        new Date(),
      );
      await this.categories.save(category);
      return { id: category.id };
    });
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }
}
