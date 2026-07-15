import type { StockDocumentError } from "../../../../domain/errors/stock-document.errors";
import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import { StockDocumentLineBuilder } from "../stock-document-line.builder";
import { StockDocumentDraftCommandHandlerBase } from "../stock-document-draft-command.base";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { AddStockDocumentLineCommand } from "./add-stock-document-line.command";
import { Result } from "@is-kontrol/shared-result";

export class AddStockDocumentLineHandler extends StockDocumentDraftCommandHandlerBase {
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
    command: AddStockDocumentLineCommand,
  ): Promise<Result<void, StockDocumentError>> {
    return this.mutateDraft(command.documentId, async (document) => {
      const logical = await this.logicalLines(document);
      return this.replaceLines(document, [
        ...logical.map((line) => line.input),
        {
          productId: command.productId,
          unitId: command.unitId,
          quantity: command.quantity,
          unitPrice: command.unitPrice,
          notes: command.notes,
        },
      ]);
    });
  }
}
