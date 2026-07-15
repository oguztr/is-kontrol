import type { StockMovementEntity } from "../../../../domain/entities/stock-movement.entity";
import { StockDocumentErrors } from "../../../../domain/errors/stock-document.errors";
import type { StockDocumentError } from "../../../../domain/errors/stock-document.errors";
import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { GetDocumentMovementsQuery } from "./get-document-movements.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class GetDocumentMovementsHandler {
  constructor(
    private readonly movements: IStockMovementRepository,
    private readonly documents: IStockDocumentRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetDocumentMovementsQuery,
  ): Promise<Result<StockMovementEntity[], StockDocumentError>> {
    const document = await this.documents.findById(query.documentId);
    if (!document || !this.actor.allowsCompany(document.companyId))
      return new Failure(StockDocumentErrors.notFound(query.documentId));
    return new Success(await this.movements.findByDocumentId(query.documentId));
  }
}
