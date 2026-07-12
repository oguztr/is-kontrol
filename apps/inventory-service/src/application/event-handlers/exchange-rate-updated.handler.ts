import type { IConsumedEventHandler } from './consumed-event'

// TODO: inject exchange rate repository when implemented
export class ExchangeRateUpdatedHandler implements IConsumedEventHandler {
  async handle(): Promise<void> {
    // upsert into exchange_rate_references via repository
  }
}
