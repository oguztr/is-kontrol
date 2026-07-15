import type { StockDocumentEntity } from "../../../../domain/entities/stock-document.entity";
import { StockDocumentErrors } from "../../../../domain/errors/stock-document.errors";
import type { StockDocumentError } from "../../../../domain/errors/stock-document.errors";
import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { GetStockDocumentByNumberQuery } from "./get-stock-document-by-number.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class GetStockDocumentByNumberHandler {
  constructor(
    private readonly documents: IStockDocumentRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetStockDocumentByNumberQuery,
  ): Promise<Result<StockDocumentEntity, StockDocumentError>> {
    if (!this.actor.allowsCompany(query.companyId))
      return new Failure(StockDocumentErrors.notFound(query.documentNumber));
    const document = await this.documents.findByDocumentNumber(
      query.companyId,
      query.documentNumber,
    );
    return document
      ? new Success(document)
      : new Failure(StockDocumentErrors.notFound(query.documentNumber));
  }
}
