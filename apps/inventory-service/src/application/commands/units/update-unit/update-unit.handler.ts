import type { UnitError } from "../../../../domain/errors/unit.errors";
import type { IUnitRepository } from "../../../../domain/repositories/unit.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { UnitCommandHandlerBase } from "../unit-command.base";
import { UpdateUnitCommand } from "./update-unit.command";
import { Result } from "@is-kontrol/shared-result";

export class UpdateUnitHandler extends UnitCommandHandlerBase {
  constructor(
    units: IUnitRepository,
    unitOfWork: IUnitOfWorkPort,
    actor: IActorContextPort,
  ) {
    super(units, unitOfWork, actor);
  }

  async execute(command: UpdateUnitCommand): Promise<Result<void, UnitError>> {
    return this.changeUnit(command.id, (unit) => unit.update(command.name));
  }
}
