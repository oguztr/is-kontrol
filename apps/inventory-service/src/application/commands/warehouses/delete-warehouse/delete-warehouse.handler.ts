import { WarehouseErrors } from "../../../../domain/errors/warehouse.errors";
import type { WarehouseError } from "../../../../domain/errors/warehouse.errors";
import type { IWarehouseRepository } from "../../../../domain/repositories/warehouse.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { DeleteWarehouseCommand } from "./delete-warehouse.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class DeleteWarehouseHandler {
  constructor(
    private readonly warehouses: IWarehouseRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: DeleteWarehouseCommand,
  ): Promise<Result<void, WarehouseError>> {
    const error = await this.unitOfWork.run<WarehouseError | undefined>(
      async () => {
        const warehouse = await this.warehouses.findById(command.id);
        if (!warehouse || !this.actor.allowsCompany(warehouse.companyId))
          return WarehouseErrors.notFound(command.id);
        if (await this.warehouses.hasStock(command.id))
          return WarehouseErrors.hasStock(command.id);
        warehouse.delete(new Date());
        await this.warehouses.update(warehouse);
        return undefined;
      },
    );
    return error ? new Failure(error) : new Success(undefined);
  }
}
