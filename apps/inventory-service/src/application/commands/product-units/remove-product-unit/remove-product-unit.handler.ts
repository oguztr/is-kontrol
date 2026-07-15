import { ProductUnitErrors } from "../../../../domain/errors/product-unit.errors";
import type { ProductUnitError } from "../../../../domain/errors/product-unit.errors";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IProductUnitRepository } from "../../../../domain/repositories/product-unit.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { RemoveProductUnitCommand } from "./remove-product-unit.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class RemoveProductUnitHandler {
  constructor(
    private readonly products: IProductRepository,
    private readonly productUnits: IProductUnitRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: RemoveProductUnitCommand,
  ): Promise<Result<void, ProductUnitError>> {
    const error = await this.unitOfWork.run<ProductUnitError | undefined>(
      async () => {
        const productUnit = await this.productUnits.findById(command.id);
        if (!productUnit) return ProductUnitErrors.notFound(command.id);
        const product = await this.products.findById(productUnit.productId);
        if (product && !this.actor.allowsCompany(product.companyId))
          return ProductUnitErrors.notFound(command.id);
        if (product && productUnit.unitId === product.baseUnitId) {
          return ProductUnitErrors.baseUnitCannotBeRemoved(
            productUnit.productId,
            productUnit.unitId,
          );
        }
        await this.productUnits.delete(command.id);
        return undefined;
      },
    );
    return error ? new Failure(error) : new Success(undefined);
  }
}
