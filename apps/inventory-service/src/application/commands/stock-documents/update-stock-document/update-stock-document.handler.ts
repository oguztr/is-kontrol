import type { StockDocumentEntity } from "../../../../domain/entities/stock-document.entity";
import { StockDocumentErrors } from "../../../../domain/errors/stock-document.errors";
import type { StockDocumentError } from "../../../../domain/errors/stock-document.errors";
import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import type { IBusinessPartnerReferenceRepository } from "../../../../domain/repositories/business-partner-reference.repository.interface";
import { Decimal } from "../../../../domain/value-objects/decimal.vo";
import { StockDocumentLineBuilder } from "../stock-document-line.builder";
import { StockDocumentDraftCommandHandlerBase } from "../stock-document-draft-command.base";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { UpdateStockDocumentCommand } from "./update-stock-document.command";
import { Result } from "@is-kontrol/shared-result";

export class UpdateStockDocumentHandler extends StockDocumentDraftCommandHandlerBase {
  constructor(
    documents: IStockDocumentRepository,
    movements: IStockMovementRepository,
    private readonly partners: IBusinessPartnerReferenceRepository,
    lineBuilder: StockDocumentLineBuilder,
    unitOfWork: IUnitOfWorkPort,
    actor: IActorContextPort,
  ) {
    super(documents, movements, lineBuilder, unitOfWork, actor);
  }

  async execute(
    command: UpdateStockDocumentCommand,
  ): Promise<Result<void, StockDocumentError>> {
    return this.mutateDraft(command.id, async (document) => {
      if (command.partnerId) {
        const partnerError = await this.partnerError(
          document,
          command.partnerId,
        );
        if (partnerError) return partnerError;
      }
      const rateChanged =
        command.exchangeRate !== undefined &&
        Decimal.from(command.exchangeRate).toFixed(8) !==
          Decimal.from(document.exchangeRate).toFixed(8);
      document.updateDraft({
        documentDate: command.documentDate,
        partnerId: command.partnerId,
        exchangeRate: command.exchangeRate,
        notes: command.notes,
      });
      if (rateChanged) {
        // Kur değişince satır tutarları yeni kurla yeniden hesaplanır.
        const logical = await this.logicalLines(document);
        const rebuildError = await this.replaceLines(
          document,
          logical.map((line) => line.input),
        );
        if (rebuildError) return rebuildError;
      }
      await this.documents.update(document);
      return undefined;
    });
  }

  private async partnerError(
    document: StockDocumentEntity,
    partnerId: string,
  ): Promise<StockDocumentError | undefined> {
    const partner = await this.partners.findById(partnerId);
    if (
      !partner ||
      partner.companyId !== document.companyId ||
      !partner.isActive
    ) {
      return StockDocumentErrors.partnerNotFound(partnerId);
    }
    const requiredPartnerType =
      document.documentType === "PURCHASE" ||
      document.documentType === "RETURN_OUT"
        ? "SUPPLIER"
        : document.documentType === "SALE" ||
            document.documentType === "RETURN_IN"
          ? "CUSTOMER"
          : null;
    if (
      requiredPartnerType &&
      partner.type !== requiredPartnerType &&
      partner.type !== "BOTH"
    ) {
      return StockDocumentErrors.invalidPartnerType(
        partnerId,
        document.documentType,
      );
    }
    return undefined;
  }
}
