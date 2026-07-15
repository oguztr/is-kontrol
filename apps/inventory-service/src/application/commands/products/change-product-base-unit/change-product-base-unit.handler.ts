import { ProductErrors } from "../../../../domain/errors/product.errors";
import type { ProductError } from "../../../../domain/errors/product.errors";
import { ProductUnitEntity } from "../../../../domain/entities/product-unit.entity";
import type { IProductDependencyRepository } from "../../../../domain/repositories/product-dependency.repository.interface";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IProductUnitRepository } from "../../../../domain/repositories/product-unit.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { ProductCommandHandlerBase } from "../product-command.base";
import { ChangeProductBaseUnitCommand } from "./change-product-base-unit.command";
import { Result } from "@is-kontrol/shared-result";

export class ChangeProductBaseUnitHandler extends ProductCommandHandlerBase {
  constructor(
    products: IProductRepository,
    dependencies: IProductDependencyRepository,
    private readonly productUnits: IProductUnitRepository,
    publisher: IEventPublisherPort,
    unitOfWork: IUnitOfWorkPort,
    actor: IActorContextPort,
  ) {
    super(products, dependencies, publisher, unitOfWork, actor);
  }

  async execute(
    command: ChangeProductBaseUnitCommand,
  ): Promise<Result<void, ProductError>> {
    return this.mutate(
      command.id,
      "product.base-unit.changed",
      async (product) => {
        if (await this.products.hasMovements(command.id))
          return ProductErrors.baseUnitChangeHasMovements(command.id);
        if (
          !(await this.dependencies.unitBelongsToCompany(
            command.baseUnitId,
            product.companyId,
          ))
        ) {
          return ProductErrors.baseUnitNotFound(command.baseUnitId);
        }
        product.changeBaseUnit(command.baseUnitId);
        // Yeni ana birim, ürün birimlerinde 1 katsayısıyla mutlaka yer alır.
        await this.productUnits.lockProductUnits(command.id);
        const existing = await this.productUnits.findByProductAndUnit(
          command.id,
          command.baseUnitId,
        );
        if (existing) {
          existing.setConversionFactor("1.000000");
          await this.productUnits.update(existing);
        } else {
          await this.productUnits.save(
            new ProductUnitEntity(
              crypto.randomUUID(),
              command.id,
              command.baseUnitId,
              "1.000000",
              true,
              true,
              null,
              new Date(),
            ),
          );
        }
        return undefined;
      },
    );
  }
}
