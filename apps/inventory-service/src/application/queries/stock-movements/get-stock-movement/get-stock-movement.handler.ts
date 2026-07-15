import type { StockMovementEntity } from "../../../../domain/entities/stock-movement.entity";
import { StockDocumentErrors } from "../../../../domain/errors/stock-document.errors";
import type { StockDocumentError } from "../../../../domain/errors/stock-document.errors";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { GetStockMovementQuery } from "./get-stock-movement.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class GetStockMovementHandler {
  constructor(
    private readonly movements: IStockMovementRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetStockMovementQuery,
  ): Promise<Result<StockMovementEntity, StockDocumentError>> {
    const movement = await this.movements.findById(query.id);
    return movement && this.actor.allowsCompany(movement.companyId)
      ? new Success(movement)
      : new Failure(StockDocumentErrors.movementNotFound(query.id));
  }
}
