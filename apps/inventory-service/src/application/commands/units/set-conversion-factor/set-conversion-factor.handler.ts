import { UnitErrors } from "../../../../domain/errors/unit.errors";
import type { UnitError } from "../../../../domain/errors/unit.errors";
import type { IUnitRepository } from "../../../../domain/repositories/unit.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { Decimal } from "../../../../domain/value-objects/decimal.vo";
import { UnitCommandHandlerBase } from "../unit-command.base";
import { SetConversionFactorCommand } from "./set-conversion-factor.command";
import { Result } from "@is-kontrol/shared-result";

export class SetConversionFactorHandler extends UnitCommandHandlerBase {
  constructor(
    units: IUnitRepository,
    unitOfWork: IUnitOfWorkPort,
    actor: IActorContextPort,
  ) {
    super(units, unitOfWork, actor);
  }

  async execute(
    command: SetConversionFactorCommand,
  ): Promise<Result<void, UnitError>> {
    return this.changeUnit(command.id, (unit) => {
      const normalized = Decimal.from(command.factorToBase).toFixed(6);
      if (unit.isBaseUnit && normalized !== "1.000000") {
        return UnitErrors.baseUnitFactorMustBeOne(command.id);
      }
      unit.setConversionFactor(normalized);
      return undefined;
    });
  }
}
