import type { WarehouseError } from "../../../../domain/errors/warehouse.errors";
import type { IWarehouseRepository } from "../../../../domain/repositories/warehouse.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { WarehouseCommandHandlerBase } from "../warehouse-command.base";
import { DeactivateWarehouseCommand } from "./deactivate-warehouse.command";
import { Result } from "@is-kontrol/shared-result";

export class DeactivateWarehouseHandler extends WarehouseCommandHandlerBase {
  constructor(
    warehouses: IWarehouseRepository,
    publisher: IEventPublisherPort,
    unitOfWork: IUnitOfWorkPort,
    actor: IActorContextPort,
  ) {
    super(warehouses, publisher, unitOfWork, actor);
  }

  async execute(
    command: DeactivateWarehouseCommand,
  ): Promise<Result<void, WarehouseError>> {
    return this.change(command.id, "warehouse.deactivated", (warehouse) =>
      warehouse.deactivate(),
    );
  }
}
