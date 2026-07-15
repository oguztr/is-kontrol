import type { WarehouseEntity } from "../../../domain/entities/warehouse.entity";
import { WarehouseErrors } from "../../../domain/errors/warehouse.errors";
import type { WarehouseError } from "../../../domain/errors/warehouse.errors";
import type { IWarehouseRepository } from "../../../domain/repositories/warehouse.repository.interface";
import type { IEventPublisherPort } from "../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../ports/actor-context.port";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

/* Depoyu transaction içinde değiştirip domain event'ini outbox'a yazan
 * command handler'ların ortak gövdesi. */
export abstract class WarehouseCommandHandlerBase {
  protected constructor(
    protected readonly warehouses: IWarehouseRepository,
    protected readonly publisher: IEventPublisherPort,
    protected readonly unitOfWork: IUnitOfWorkPort,
    protected readonly actor: IActorContextPort,
  ) {}

  protected async change(
    id: string,
    eventType: string,
    change: (warehouse: WarehouseEntity) => void,
  ): Promise<Result<void, WarehouseError>> {
    const error = await this.unitOfWork.run<WarehouseError | undefined>(
      async () => {
        const warehouse = await this.warehouses.findById(id);
        if (!warehouse || !this.actor.allowsCompany(warehouse.companyId))
          return WarehouseErrors.notFound(id);
        change(warehouse);
        await this.warehouses.update(warehouse);
        await this.publishEvent(eventType, warehouse);
        return undefined;
      },
    );
    return error ? new Failure(error) : new Success(undefined);
  }

  protected async publishEvent(
    eventType: string,
    warehouse: WarehouseEntity,
  ): Promise<void> {
    await this.publisher.publish({
      aggregateType: "Warehouse",
      aggregateId: warehouse.id,
      eventType,
      payload: {
        id: warehouse.id,
        companyId: warehouse.companyId,
        code: warehouse.code,
        name: warehouse.name,
        isActive: warehouse.isActive,
        occurredAt: new Date().toISOString(),
      },
    });
  }
}
