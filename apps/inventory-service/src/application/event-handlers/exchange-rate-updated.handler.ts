import type { InboxEvent } from "../../domain/repositories/inbox.repository.interface";

// TODO: inject exchange rate repository when implemented
export class ExchangeRateUpdatedHandler {
  async handle(_event: InboxEvent): Promise<void> {
    // upsert into exchange_rate_references via repository
  }
}
