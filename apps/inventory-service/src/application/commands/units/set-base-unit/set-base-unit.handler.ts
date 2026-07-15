import { UnitErrors } from "../../../../domain/errors/unit.errors";
import type { UnitError } from "../../../../domain/errors/unit.errors";
import type { IUnitRepository } from "../../../../domain/repositories/unit.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { SetBaseUnitCommand } from "./set-base-unit.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class SetBaseUnitHandler {
  constructor(
    private readonly units: IUnitRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(command: SetBaseUnitCommand): Promise<Result<void, UnitError>> {
    const error = await this.unitOfWork.run<UnitError | undefined>(async () => {
      const unit = await this.units.findUnitById(command.id);
      if (!unit || !this.actor.allowsCompany(unit.companyId))
        return UnitErrors.unitNotFound(command.id);
      await this.units.lockGroup(unit.unitGroupId);
      await this.units.clearBaseUnit(unit.unitGroupId, unit.id);
      unit.makeBase();
      await this.units.updateUnit(unit);
      return undefined;
    });
    return error ? new Failure(error) : new Success(undefined);
  }
}
