import type { StockDocumentEntity } from "../../../../domain/entities/stock-document.entity";
import type { StockMovementEntity } from "../../../../domain/entities/stock-movement.entity";
import { StockDocumentErrors } from "../../../../domain/errors/stock-document.errors";
import type { StockDocumentError } from "../../../../domain/errors/stock-document.errors";
import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { GetStockDocumentQuery } from "./get-stock-document.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export interface StockDocumentDetail {
  document: StockDocumentEntity;
  lines: StockMovementEntity[];
}

export class GetStockDocumentHandler {
  constructor(
    private readonly documents: IStockDocumentRepository,
    private readonly movements: IStockMovementRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetStockDocumentQuery,
  ): Promise<Result<StockDocumentDetail, StockDocumentError>> {
    const document = await this.documents.findById(query.id);
    if (!document || !this.actor.allowsCompany(document.companyId))
      return new Failure(StockDocumentErrors.notFound(query.id));
    const lines = await this.movements.findByDocumentId(query.id);
    return new Success({ document, lines });
  }
}
