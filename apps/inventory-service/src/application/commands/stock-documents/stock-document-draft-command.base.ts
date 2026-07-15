import type { StockDocumentEntity } from "../../../domain/entities/stock-document.entity";
import { StockDocumentErrors } from "../../../domain/errors/stock-document.errors";
import type { StockDocumentError } from "../../../domain/errors/stock-document.errors";
import type { IStockDocumentRepository } from "../../../domain/repositories/stock-document.repository.interface";
import type { IStockMovementRepository } from "../../../domain/repositories/stock-movement.repository.interface";
import { StockDocumentLineBuilder } from "./stock-document-line.builder";
import type {
  DocumentLineContext,
  DocumentLineInput,
} from "./stock-document-line.builder";
import type { IUnitOfWorkPort } from "../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../ports/actor-context.port";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

/* Mantıksal satır: TRANSFER belgelerinde ardışık OUT+IN hareket çifti, diğer
 * türlerde tek hareket. Tüm yazma yolları satırları bu kuralla yeniden
 * ürettiği için çift gruplaması güvenlidir. */
export interface LogicalLine {
  lineNumbers: number[];
  input: DocumentLineInput;
}

/* Taslak belgeyi kilitleyip değiştiren command handler'ların ortak gövdesi.
 * POSTED/CANCELLED belgelere yazma reddedilir. */
export abstract class StockDocumentDraftCommandHandlerBase {
  protected constructor(
    protected readonly documents: IStockDocumentRepository,
    protected readonly movements: IStockMovementRepository,
    protected readonly lineBuilder: StockDocumentLineBuilder,
    protected readonly unitOfWork: IUnitOfWorkPort,
    protected readonly actor: IActorContextPort,
  ) {}

  protected async mutateDraft(
    id: string,
    change: (
      document: StockDocumentEntity,
    ) => Promise<StockDocumentError | undefined>,
  ): Promise<Result<void, StockDocumentError>> {
    const error = await this.unitOfWork.run<StockDocumentError | undefined>(
      async () => {
        const document = await this.documents.findByIdForUpdate(id);
        if (!document || !this.actor.allowsCompany(document.companyId))
          return StockDocumentErrors.notFound(id);
        if (document.status === "POSTED")
          return StockDocumentErrors.alreadyPosted(id);
        if (document.status === "CANCELLED")
          return StockDocumentErrors.alreadyCancelled(id);
        return change(document);
      },
    );
    return error ? new Failure(error) : new Success(undefined);
  }

  protected lineContext(document: StockDocumentEntity): DocumentLineContext {
    return {
      documentId: document.id,
      companyId: document.companyId,
      documentType: document.documentType,
      warehouseId: document.warehouseId,
      targetWarehouseId: document.targetWarehouseId,
      currencyId: document.currencyId,
      exchangeRate: document.exchangeRate,
    };
  }

  protected async logicalLines(
    document: StockDocumentEntity,
  ): Promise<LogicalLine[]> {
    const movements = await this.movements.findByDocumentId(document.id);
    const groupSize = document.documentType === "TRANSFER" ? 2 : 1;
    const lines: LogicalLine[] = [];
    for (let index = 0; index < movements.length; index += groupSize) {
      const group = movements.slice(index, index + groupSize);
      const first = group[0];
      lines.push({
        lineNumbers: group.map((movement) => movement.lineNumber),
        input: {
          productId: first.productId,
          unitId: first.unitId,
          quantity: first.quantity,
          unitPrice: first.unitPrice,
          notes: first.notes,
        },
      });
    }
    return lines;
  }

  protected async replaceLines(
    document: StockDocumentEntity,
    inputs: DocumentLineInput[],
  ): Promise<StockDocumentError | undefined> {
    const rebuilt = await this.lineBuilder.build(
      this.lineContext(document),
      inputs,
    );
    if (!Array.isArray(rebuilt)) return rebuilt;
    await this.movements.replaceForDocument(document.id, rebuilt);
    return undefined;
  }
}
