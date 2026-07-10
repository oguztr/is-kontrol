import type { InboxEvent } from '../../domain/repositories/inbox.repository.interface'

// Triggers automatic goods-issue document creation on confirmed sales orders.
// Implementation deferred until PostStockDocumentHandler is wired to DI.
export class SalesOrderConfirmedHandler {
  async handle(_event: InboxEvent): Promise<void> {
    // TODO: create and post a SALE type stock document for each confirmed order line
  }
}
