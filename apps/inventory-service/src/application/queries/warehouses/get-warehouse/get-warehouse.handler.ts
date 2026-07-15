import type { WarehouseEntity } from "../../../../domain/entities/warehouse.entity";
import { WarehouseErrors } from "../../../../domain/errors/warehouse.errors";
import type { WarehouseError } from "../../../../domain/errors/warehouse.errors";
import type { IWarehouseRepository } from "../../../../domain/repositories/warehouse.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { GetWarehouseQuery } from "./get-warehouse.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class GetWarehouseHandler {
  constructor(
    private readonly warehouses: IWarehouseRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetWarehouseQuery,
  ): Promise<Result<WarehouseEntity, WarehouseError>> {
    const warehouse = await this.warehouses.findById(query.id);
    return warehouse && this.actor.allowsCompany(warehouse.companyId)
      ? new Success(warehouse)
      : new Failure(WarehouseErrors.notFound(query.id));
  }
}
