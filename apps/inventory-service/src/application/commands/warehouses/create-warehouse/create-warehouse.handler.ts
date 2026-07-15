import { WarehouseEntity } from "../../../../domain/entities/warehouse.entity";
import { WarehouseErrors } from "../../../../domain/errors/warehouse.errors";
import type { WarehouseError } from "../../../../domain/errors/warehouse.errors";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IWarehouseRepository } from "../../../../domain/repositories/warehouse.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { WarehouseCommandHandlerBase } from "../warehouse-command.base";
import { CreateWarehouseCommand } from "./create-warehouse.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class CreateWarehouseHandler extends WarehouseCommandHandlerBase {
  constructor(
    warehouses: IWarehouseRepository,
    private readonly companies: ICompanyReferenceRepository,
    publisher: IEventPublisherPort,
    unitOfWork: IUnitOfWorkPort,
    actor: IActorContextPort,
  ) {
    super(warehouses, publisher, unitOfWork, actor);
  }

  async execute(
    command: CreateWarehouseCommand,
  ): Promise<Result<{ id: string }, WarehouseError>> {
    const outcome = await this.unitOfWork.run<{ id: string } | WarehouseError>(
      async () => {
        if (!this.actor.allowsCompany(command.companyId))
          return WarehouseErrors.companyNotFound(command.companyId);
        const company = await this.companies.findById(command.companyId);
        if (!company) return WarehouseErrors.companyNotFound(command.companyId);
        if (!company.isActive)
          return WarehouseErrors.companyInactive(command.companyId);
        const warehouse = new WarehouseEntity({
          id: crypto.randomUUID(),
          companyId: command.companyId,
          code: command.code,
          name: command.name,
          address: command.address,
          isActive: true,
          createdAt: new Date(),
        });
        if (!(await this.warehouses.save(warehouse))) {
          return WarehouseErrors.codeAlreadyExists(
            command.companyId,
            command.code,
          );
        }
        await this.publishEvent("warehouse.created", warehouse);
        return { id: warehouse.id };
      },
    );
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }
}
