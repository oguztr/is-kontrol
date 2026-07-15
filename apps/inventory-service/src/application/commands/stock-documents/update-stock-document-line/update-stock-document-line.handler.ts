import { StockDocumentErrors } from "../../../../domain/errors/stock-document.errors";
import type { StockDocumentError } from "../../../../domain/errors/stock-document.errors";
import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import { StockDocumentLineBuilder } from "../stock-document-line.builder";
import type { DocumentLineInput } from "../stock-document-line.builder";
import { StockDocumentDraftCommandHandlerBase } from "../stock-document-draft-command.base";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { UpdateStockDocumentLineCommand } from "./update-stock-document-line.command";
import { Result } from "@is-kontrol/shared-result";

export class UpdateStockDocumentLineHandler extends StockDocumentDraftCommandHandlerBase {
  constructor(
    documents: IStockDocumentRepository,
    movements: IStockMovementRepository,
    lineBuilder: StockDocumentLineBuilder,
    unitOfWork: IUnitOfWorkPort,
    actor: IActorContextPort,
  ) {
    super(documents, movements, lineBuilder, unitOfWork, actor);
  }

  async execute(
    command: UpdateStockDocumentLineCommand,
  ): Promise<Result<void, StockDocumentError>> {
    return this.mutateDraft(command.documentId, async (document) => {
      const logical = await this.logicalLines(document);
      const target = logical.find((line) =>
        line.lineNumbers.includes(command.lineNumber),
      );
      if (!target)
        return StockDocumentErrors.lineNotFound(
          command.documentId,
          command.lineNumber,
        );
      const merged: DocumentLineInput = {
        productId: command.productId ?? target.input.productId,
        unitId: command.unitId ?? target.input.unitId,
        quantity: command.quantity ?? target.input.quantity,
        unitPrice: command.unitPrice ?? target.input.unitPrice,
        notes: command.notes === undefined ? target.input.notes : command.notes,
      };
      return this.replaceLines(
        document,
        logical.map((line) => (line === target ? merged : line.input)),
      );
    });
  }
}
