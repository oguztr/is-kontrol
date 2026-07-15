import type { UnitOfMeasureEntity } from "../../../../domain/entities/unit-of-measure.entity";
import { UnitErrors } from "../../../../domain/errors/unit.errors";
import type { UnitError } from "../../../../domain/errors/unit.errors";
import type { IUnitRepository } from "../../../../domain/repositories/unit.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { GetUnitQuery } from "./get-unit.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class GetUnitHandler {
  constructor(
    private readonly units: IUnitRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetUnitQuery,
  ): Promise<Result<UnitOfMeasureEntity, UnitError>> {
    const unit = await this.units.findUnitById(query.id);
    return unit && this.actor.allowsCompany(unit.companyId)
      ? new Success(unit)
      : new Failure(UnitErrors.unitNotFound(query.id));
  }
}
