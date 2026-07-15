import { Decimal } from "../../../../domain/value-objects/decimal.vo";
import { ProductUnitEntity } from "../../../../domain/entities/product-unit.entity";
import { ProductUnitErrors } from "../../../../domain/errors/product-unit.errors";
import type { ProductUnitError } from "../../../../domain/errors/product-unit.errors";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IProductDependencyRepository } from "../../../../domain/repositories/product-dependency.repository.interface";
import type { IProductUnitRepository } from "../../../../domain/repositories/product-unit.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { AddProductUnitCommand } from "./add-product-unit.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

const BASE_FACTOR = "1.000000";

export class AddProductUnitHandler {
  constructor(
    private readonly products: IProductRepository,
    private readonly dependencies: IProductDependencyRepository,
    private readonly productUnits: IProductUnitRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: AddProductUnitCommand,
  ): Promise<Result<{ id: string }, ProductUnitError>> {
    const outcome = await this.unitOfWork.run<
      { id: string } | ProductUnitError
    >(async () => {
      const product = await this.products.findById(command.productId);
      if (
        !product ||
        product.deletedAt ||
        !this.actor.allowsCompany(product.companyId)
      )
        return ProductUnitErrors.productNotFound(command.productId);
      if (product.archivedAt)
        return ProductUnitErrors.productArchived(command.productId);
      if (
        !(await this.dependencies.unitBelongsToCompany(
          command.unitId,
          product.companyId,
        ))
      ) {
        return ProductUnitErrors.unitNotFound(command.unitId);
      }
      await this.productUnits.lockProductUnits(command.productId);
      const factor = Decimal.from(command.conversionFactor).toFixed(6);
      if (command.unitId === product.baseUnitId && factor !== BASE_FACTOR)
        return ProductUnitErrors.baseUnitFactorMustBeOne(command.unitId);
      const productUnit = new ProductUnitEntity(
        crypto.randomUUID(),
        command.productId,
        command.unitId,
        factor,
        command.isPurchaseUnit,
        command.isSalesUnit,
        command.barcode,
        new Date(),
      );
      if (!(await this.productUnits.save(productUnit)))
        return ProductUnitErrors.alreadyExists(
          command.productId,
          command.unitId,
        );
      return { id: productUnit.id };
    });
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }
}
