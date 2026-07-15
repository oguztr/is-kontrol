import type { StockDocumentEntity } from "../../../../domain/entities/stock-document.entity";
import { StockDocumentErrors } from "../../../../domain/errors/stock-document.errors";
import type { StockDocumentError } from "../../../../domain/errors/stock-document.errors";
import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { ListStockDocumentsQuery } from "./list-stock-documents.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class ListStockDocumentsHandler {
  constructor(
    private readonly documents: IStockDocumentRepository,
    private readonly companies: ICompanyReferenceRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: ListStockDocumentsQuery,
  ): Promise<Result<StockDocumentEntity[], StockDocumentError>> {
    if (!this.actor.allowsCompany(query.companyId))
      return new Failure(StockDocumentErrors.companyNotFound(query.companyId));
    const company = await this.companies.findById(query.companyId);
    if (!company)
      return new Failure(StockDocumentErrors.companyNotFound(query.companyId));
    return new Success(
      await this.documents.list({
        companyId: query.companyId,
        documentNumber: query.documentNumber,
        documentType: query.documentType,
        status: query.status,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        partnerId: query.partnerId,
        warehouseId: query.warehouseId,
      }),
    );
  }
}
