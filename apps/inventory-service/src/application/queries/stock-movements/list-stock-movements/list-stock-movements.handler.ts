import type { StockMovementEntity } from "../../../../domain/entities/stock-movement.entity";
import { StockDocumentErrors } from "../../../../domain/errors/stock-document.errors";
import type { StockDocumentError } from "../../../../domain/errors/stock-document.errors";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { ListStockMovementsQuery } from "./list-stock-movements.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class ListStockMovementsHandler {
  constructor(
    private readonly movements: IStockMovementRepository,
    private readonly companies: ICompanyReferenceRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: ListStockMovementsQuery,
  ): Promise<Result<StockMovementEntity[], StockDocumentError>> {
    if (!this.actor.allowsCompany(query.companyId))
      return new Failure(StockDocumentErrors.companyNotFound(query.companyId));
    const company = await this.companies.findById(query.companyId);
    if (!company)
      return new Failure(StockDocumentErrors.companyNotFound(query.companyId));
    return new Success(
      await this.movements.list({
        companyId: query.companyId,
        productId: query.productId,
        warehouseId: query.warehouseId,
        partnerId: query.partnerId,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
      }),
    );
  }
}
