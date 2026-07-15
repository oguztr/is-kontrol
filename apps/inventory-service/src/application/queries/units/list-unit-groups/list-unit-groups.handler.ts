import type { UnitGroupEntity } from "../../../../domain/entities/unit-group.entity";
import { UnitErrors } from "../../../../domain/errors/unit.errors";
import type { UnitError } from "../../../../domain/errors/unit.errors";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IUnitRepository } from "../../../../domain/repositories/unit.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { ListUnitGroupsQuery } from "./list-unit-groups.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class ListUnitGroupsHandler {
  constructor(
    private readonly units: IUnitRepository,
    private readonly companies: ICompanyReferenceRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: ListUnitGroupsQuery,
  ): Promise<Result<UnitGroupEntity[], UnitError>> {
    if (!this.actor.allowsCompany(query.companyId))
      return new Failure(UnitErrors.companyNotFound(query.companyId));
    const company = await this.companies.findById(query.companyId);
    if (!company)
      return new Failure(UnitErrors.companyNotFound(query.companyId));
    return new Success(await this.units.listGroups(query.companyId));
  }
}
