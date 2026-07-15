import type { UnitOfMeasureEntity } from "../../../../domain/entities/unit-of-measure.entity";
import { UnitErrors } from "../../../../domain/errors/unit.errors";
import type { UnitError } from "../../../../domain/errors/unit.errors";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IUnitRepository } from "../../../../domain/repositories/unit.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { ListUnitsQuery } from "./list-units.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class ListUnitsHandler {
  constructor(
    private readonly units: IUnitRepository,
    private readonly companies: ICompanyReferenceRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: ListUnitsQuery,
  ): Promise<Result<UnitOfMeasureEntity[], UnitError>> {
    if (!this.actor.allowsCompany(query.companyId))
      return new Failure(UnitErrors.companyNotFound(query.companyId));
    const company = await this.companies.findById(query.companyId);
    if (!company)
      return new Failure(UnitErrors.companyNotFound(query.companyId));
    if (query.unitGroupId) {
      const group = await this.units.findGroupById(query.unitGroupId);
      if (!group || group.companyId !== query.companyId)
        return new Failure(UnitErrors.groupNotFound(query.unitGroupId));
    }
    return new Success(
      await this.units.listUnits(query.companyId, query.unitGroupId),
    );
  }
}
