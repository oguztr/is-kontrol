import type { WarehouseEntity } from "../../../../domain/entities/warehouse.entity";
import { WarehouseErrors } from "../../../../domain/errors/warehouse.errors";
import type { WarehouseError } from "../../../../domain/errors/warehouse.errors";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IWarehouseRepository } from "../../../../domain/repositories/warehouse.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { ListWarehousesQuery } from "./list-warehouses.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class ListWarehousesHandler {
  constructor(
    private readonly warehouses: IWarehouseRepository,
    private readonly companies: ICompanyReferenceRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: ListWarehousesQuery,
  ): Promise<Result<WarehouseEntity[], WarehouseError>> {
    if (!this.actor.allowsCompany(query.companyId))
      return new Failure(WarehouseErrors.companyNotFound(query.companyId));
    const company = await this.companies.findById(query.companyId);
    if (!company)
      return new Failure(WarehouseErrors.companyNotFound(query.companyId));
    return new Success(await this.warehouses.list(query.companyId));
  }
}
