import type { StockDocumentError } from "../../../../domain/errors/stock-document.errors";
import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import { StockDocumentLineBuilder } from "../stock-document-line.builder";
import { StockDocumentDraftCommandHandlerBase } from "../stock-document-draft-command.base";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { DeleteStockDocumentCommand } from "./delete-stock-document.command";
import { Result } from "@is-kontrol/shared-result";

export class DeleteStockDocumentHandler extends StockDocumentDraftCommandHandlerBase {
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
    command: DeleteStockDocumentCommand,
  ): Promise<Result<void, StockDocumentError>> {
    return this.mutateDraft(command.id, async (document) => {
      await this.movements.deleteByDocumentId(document.id);
      await this.documents.delete(document.id);
      return undefined;
    });
  }
}
