import type { ProductCategoryEntity } from "../../../../domain/entities/product-category.entity";
import { ProductCategoryErrors } from "../../../../domain/errors/product-category.errors";
import type { ProductCategoryError } from "../../../../domain/errors/product-category.errors";
import type { IProductCategoryRepository } from "../../../../domain/repositories/product-category.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { UpdateProductCategoryCommand } from "./update-product-category.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class UpdateProductCategoryHandler {
  constructor(
    private readonly categories: IProductCategoryRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: UpdateProductCategoryCommand,
  ): Promise<Result<void, ProductCategoryError>> {
    const error = await this.unitOfWork.run<ProductCategoryError | undefined>(
      async () => {
        let category = await this.categories.findById(command.id);
        if (!category || !this.actor.allowsCompany(category.companyId))
          return ProductCategoryErrors.notFound(command.id);
        await this.categories.lockCompanyGraph(category.companyId);
        category = await this.categories.findById(command.id);
        if (!category) return ProductCategoryErrors.notFound(command.id);
        const cycleError = await this.validateParent(
          category,
          command.parentId,
        );
        if (cycleError) return cycleError;
        category.update(command.name, command.parentId);
        await this.categories.update(category);
        return undefined;
      },
    );
    return error ? new Failure(error) : new Success(undefined);
  }

  private async validateParent(
    category: ProductCategoryEntity,
    parentId: string | null,
  ): Promise<ProductCategoryError | undefined> {
    if (!parentId) return undefined;
    if (parentId === category.id)
      return ProductCategoryErrors.cycle(category.id);
    const visited = new Set<string>([category.id]);
    let currentId: string | null = parentId;
    while (currentId) {
      if (visited.has(currentId))
        return ProductCategoryErrors.cycle(category.id);
      visited.add(currentId);
      const current = await this.categories.findById(currentId);
      if (!current || current.companyId !== category.companyId) {
        return ProductCategoryErrors.notFound(currentId);
      }
      currentId = current.parentId;
    }
    return undefined;
  }
}
