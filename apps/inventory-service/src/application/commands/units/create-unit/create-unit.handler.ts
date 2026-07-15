import { UnitOfMeasureEntity } from "../../../../domain/entities/unit-of-measure.entity";
import { UnitErrors } from "../../../../domain/errors/unit.errors";
import type { UnitError } from "../../../../domain/errors/unit.errors";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IUnitRepository } from "../../../../domain/repositories/unit.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { Decimal } from "../../../../domain/value-objects/decimal.vo";
import { CreateUnitCommand } from "./create-unit.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class CreateUnitHandler {
  constructor(
    private readonly units: IUnitRepository,
    private readonly companies: ICompanyReferenceRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: CreateUnitCommand,
  ): Promise<Result<{ id: string }, UnitError>> {
    const outcome = await this.unitOfWork.run<{ id: string } | UnitError>(
      async () => {
        if (!this.actor.allowsCompany(command.companyId))
          return UnitErrors.companyNotFound(command.companyId);
        const company = await this.companies.findById(command.companyId);
        if (!company) return UnitErrors.companyNotFound(command.companyId);
        if (!company.isActive)
          return UnitErrors.companyInactive(command.companyId);
        const group = await this.units.findGroupById(command.unitGroupId);
        if (!group || group.companyId !== command.companyId)
          return UnitErrors.groupNotFound(command.unitGroupId);
        await this.units.lockGroup(group.id);
        if (
          !command.isBaseUnit &&
          !(await this.units.groupHasBaseUnit(group.id))
        ) {
          return UnitErrors.baseUnitRequired(group.id);
        }
        const unit = new UnitOfMeasureEntity(
          crypto.randomUUID(),
          command.companyId,
          group.id,
          command.code,
          command.name,
          false,
          Decimal.from(command.factorToBase).toFixed(6),
          true,
          new Date(),
        );
        if (!(await this.units.saveUnit(unit))) {
          return UnitErrors.unitCodeExists(command.companyId, command.code);
        }
        if (command.isBaseUnit) {
          await this.units.clearBaseUnit(group.id, unit.id);
          unit.makeBase();
          await this.units.updateUnit(unit);
        }
        return { id: unit.id };
      },
    );
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }
}
