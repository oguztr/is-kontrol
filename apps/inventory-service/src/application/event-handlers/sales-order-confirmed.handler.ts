import type { IConsumedEventHandler } from './consumed-event'

// Triggers automatic goods-issue document creation on confirmed sales orders.
// Implementation deferred until PostStockDocumentHandler is wired to DI.
export class SalesOrderConfirmedHandler implements IConsumedEventHandler {
  async handle(): Promise<void> {
    // TODO: create and post a SALE type stock document for each confirmed order line
  }
}
