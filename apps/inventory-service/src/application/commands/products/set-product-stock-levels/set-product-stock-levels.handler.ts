import { Decimal } from "../../../../domain/value-objects/decimal.vo";
import { ProductErrors } from "../../../../domain/errors/product.errors";
import type { ProductError } from "../../../../domain/errors/product.errors";
import type { IProductDependencyRepository } from "../../../../domain/repositories/product-dependency.repository.interface";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { ProductCommandHandlerBase } from "../product-command.base";
import { SetProductStockLevelsCommand } from "./set-product-stock-levels.command";
import { Result } from "@is-kontrol/shared-result";

export class SetProductStockLevelsHandler extends ProductCommandHandlerBase {
  constructor(
    products: IProductRepository,
    dependencies: IProductDependencyRepository,
    publisher: IEventPublisherPort,
    unitOfWork: IUnitOfWorkPort,
    actor: IActorContextPort,
  ) {
    super(products, dependencies, publisher, unitOfWork, actor);
  }

  async execute(
    command: SetProductStockLevelsCommand,
  ): Promise<Result<void, ProductError>> {
    return this.mutate(command.id, "product.stock-levels.changed", (product) => {
      if (
        command.maxStockLevel &&
        Decimal.from(command.minStockLevel).isGreaterThan(
          Decimal.from(command.maxStockLevel),
        )
      ) {
        return ProductErrors.invalidStockLevelRange(
          command.minStockLevel,
          command.maxStockLevel,
        );
      }
      product.setStockLevels(command.minStockLevel, command.maxStockLevel);
      return undefined;
    });
  }
}
