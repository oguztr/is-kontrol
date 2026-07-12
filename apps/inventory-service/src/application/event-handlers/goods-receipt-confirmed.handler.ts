import type { IConsumedEventHandler } from './consumed-event'

// Triggers automatic goods-receipt document creation on confirmed purchase receipts.
// Implementation deferred until PostStockDocumentHandler is wired to DI.
export class GoodsReceiptConfirmedHandler implements IConsumedEventHandler {
  async handle(): Promise<void> {
    // TODO: create and post a PURCHASE type stock document for each confirmed receipt line
  }
}
