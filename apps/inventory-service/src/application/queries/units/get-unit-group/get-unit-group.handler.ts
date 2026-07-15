import type { UnitGroupEntity } from "../../../../domain/entities/unit-group.entity";
import { UnitErrors } from "../../../../domain/errors/unit.errors";
import type { UnitError } from "../../../../domain/errors/unit.errors";
import type { IUnitRepository } from "../../../../domain/repositories/unit.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { GetUnitGroupQuery } from "./get-unit-group.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class GetUnitGroupHandler {
  constructor(
    private readonly units: IUnitRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetUnitGroupQuery,
  ): Promise<Result<UnitGroupEntity, UnitError>> {
    const group = await this.units.findGroupById(query.id);
    return group && this.actor.allowsCompany(group.companyId)
      ? new Success(group)
      : new Failure(UnitErrors.groupNotFound(query.id));
  }
}
