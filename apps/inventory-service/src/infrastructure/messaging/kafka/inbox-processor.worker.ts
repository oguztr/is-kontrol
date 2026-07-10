import type { IInboxRepository } from '../../../domain/repositories/inbox.repository.interface'
import type { CompanyCreatedHandler } from '../../../application/event-handlers/company-created.handler'
import type { CurrencyCreatedHandler } from '../../../application/event-handlers/currency-created.handler'
import type { SupplierCreatedHandler } from '../../../application/event-handlers/supplier-created.handler'
import type { CustomerCreatedHandler } from '../../../application/event-handlers/customer-created.handler'

const BATCH_SIZE = 20;
const POLL_INTERVAL_MS = 1_000;

type AnyHandler = { handle(event: any): Promise<void> };

// Polls PENDING inbox events and dispatches them to the appropriate application handler.
export class InboxProcessorWorker {
  private readonly handlers: Map<string, AnyHandler>;

  constructor(
    private readonly inboxRepository: IInboxRepository,
    companyCreatedHandler: CompanyCreatedHandler,
    currencyCreatedHandler: CurrencyCreatedHandler,
    supplierCreatedHandler: SupplierCreatedHandler,
    customerCreatedHandler: CustomerCreatedHandler,
  ) {
    this.handlers = new Map<string, AnyHandler>([
      ['company.created', companyCreatedHandler],
      ['currency.created', currencyCreatedHandler],
      ['supplier.created', supplierCreatedHandler],
      ['customer.created', customerCreatedHandler],
    ]);
  }

  async poll(): Promise<void> {
    const events = await this.inboxRepository.findPending(BATCH_SIZE);

    for (const event of events) {
      await this.inboxRepository.markAsProcessing(event.id);
      const handler = this.handlers.get(event.eventType);

      if (!handler) {
        // Bilinmeyen event; işlenmiş say ve geç
        await this.inboxRepository.markAsProcessed(event.id);
        continue;
      }

      try {
        await handler.handle(event);
        await this.inboxRepository.markAsProcessed(event.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[InboxProcessor] ${event.eventType} (${event.id}) işlenemedi:`, message);
        await this.inboxRepository.markAsFailed(event.id, message);
      }
    }
  }

  start(): NodeJS.Timeout {
    return setInterval(() => this.poll(), POLL_INTERVAL_MS);
  }
}
