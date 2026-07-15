import type { UnitOfMeasureEntity } from "../../../domain/entities/unit-of-measure.entity";
import { UnitErrors } from "../../../domain/errors/unit.errors";
import type { UnitError } from "../../../domain/errors/unit.errors";
import type { IUnitRepository } from "../../../domain/repositories/unit.repository.interface";
import type { IUnitOfWorkPort } from "../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../ports/actor-context.port";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

/* Tek bir birimi transaction içinde yükleyip değiştiren command handler'ların
 * ortak gövdesi. Başka şirketin birimi, yokmuş gibi reddedilir. */
export abstract class UnitCommandHandlerBase {
  protected constructor(
    protected readonly units: IUnitRepository,
    protected readonly unitOfWork: IUnitOfWorkPort,
    protected readonly actor: IActorContextPort,
  ) {}

  protected async changeUnit(
    id: string,
    change: (unit: UnitOfMeasureEntity) => UnitError | undefined | void,
  ): Promise<Result<void, UnitError>> {
    const error = await this.unitOfWork.run<UnitError | undefined>(async () => {
      const unit = await this.units.findUnitById(id);
      if (!unit || !this.actor.allowsCompany(unit.companyId))
        return UnitErrors.unitNotFound(id);
      const changeError = change(unit);
      if (changeError) return changeError;
      await this.units.updateUnit(unit);
      return undefined;
    });
    return error ? new Failure(error) : new Success(undefined);
  }
}
