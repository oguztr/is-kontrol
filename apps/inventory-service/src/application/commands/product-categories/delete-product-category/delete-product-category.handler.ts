import { ProductCategoryErrors } from "../../../../domain/errors/product-category.errors";
import type { ProductCategoryError } from "../../../../domain/errors/product-category.errors";
import type { IProductCategoryRepository } from "../../../../domain/repositories/product-category.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { DeleteProductCategoryCommand } from "./delete-product-category.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class DeleteProductCategoryHandler {
  constructor(
    private readonly categories: IProductCategoryRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: DeleteProductCategoryCommand,
  ): Promise<Result<void, ProductCategoryError>> {
    const error = await this.unitOfWork.run<ProductCategoryError | undefined>(
      async () => {
        let category = await this.categories.findById(command.id);
        if (!category || !this.actor.allowsCompany(category.companyId))
          return ProductCategoryErrors.notFound(command.id);
        await this.categories.lockCompanyGraph(category.companyId);
        category = await this.categories.findById(command.id);
        if (!category) return ProductCategoryErrors.notFound(command.id);
        await this.categories.detachProducts(command.id);
        await this.categories.reparentChildren(command.id, category.parentId);
        category.delete(new Date());
        await this.categories.update(category);
        return undefined;
      },
    );
    return error ? new Failure(error) : new Success(undefined);
  }
}
