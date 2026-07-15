import { UnitGroupEntity } from "../../../../domain/entities/unit-group.entity";
import { UnitErrors } from "../../../../domain/errors/unit.errors";
import type { UnitError } from "../../../../domain/errors/unit.errors";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IUnitRepository } from "../../../../domain/repositories/unit.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { CreateUnitGroupCommand } from "./create-unit-group.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class CreateUnitGroupHandler {
  constructor(
    private readonly units: IUnitRepository,
    private readonly companies: ICompanyReferenceRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: CreateUnitGroupCommand,
  ): Promise<Result<{ id: string }, UnitError>> {
    const outcome = await this.unitOfWork.run<{ id: string } | UnitError>(
      async () => {
        if (!this.actor.allowsCompany(command.companyId))
          return UnitErrors.companyNotFound(command.companyId);
        const company = await this.companies.findById(command.companyId);
        if (!company) return UnitErrors.companyNotFound(command.companyId);
        if (!company.isActive)
          return UnitErrors.companyInactive(command.companyId);
        await this.units.lockGroupName(command.companyId, command.name);
        const group = new UnitGroupEntity(
          crypto.randomUUID(),
          command.companyId,
          command.name,
          new Date(),
        );
        return (await this.units.saveGroup(group))
          ? { id: group.id }
          : UnitErrors.groupNameExists(command.companyId, command.name);
      },
    );
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }
}
