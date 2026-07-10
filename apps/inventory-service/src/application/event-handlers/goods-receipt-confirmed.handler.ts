import type { InboxEvent } from '../../domain/repositories/inbox.repository.interface'

// Triggers automatic goods-receipt document creation on confirmed purchase receipts.
// Implementation deferred until PostStockDocumentHandler is wired to DI.
export class GoodsReceiptConfirmedHandler {
  async handle(_event: InboxEvent): Promise<void> {
    // TODO: create and post a PURCHASE type stock document for each confirmed receipt line
  }
}
