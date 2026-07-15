import type { ProductError } from "../../../../domain/errors/product.errors";
import type { IProductDependencyRepository } from "../../../../domain/repositories/product-dependency.repository.interface";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { ProductCommandHandlerBase } from "../product-command.base";
import { DeactivateProductCommand } from "./deactivate-product.command";
import { Result } from "@is-kontrol/shared-result";

export class DeactivateProductHandler extends ProductCommandHandlerBase {
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
    command: DeactivateProductCommand,
  ): Promise<Result<void, ProductError>> {
    return this.mutate(command.id, "product.deactivated", (product) => {
      product.deactivate();
    });
  }
}
