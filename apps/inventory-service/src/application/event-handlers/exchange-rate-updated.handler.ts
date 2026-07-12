import type { IExchangeRateReferenceRepository } from '../../domain/repositories/exchange-rate-reference.repository.interface'
import type { ConsumedEvent, IConsumedEventHandler } from './consumed-event'

export class ExchangeRateUpdatedHandler implements IConsumedEventHandler {
  constructor(private readonly repository: IExchangeRateReferenceRepository) {}

  async handle(event: ConsumedEvent): Promise<void> {
    const payload = event.payload as {
      id: string; companyId: string; currencyCode: string; rate: string;
      effectiveAt: Date; occurredAt: Date;
    };
    await this.repository.upsert({
      id: payload.id, companyId: payload.companyId,
      currencyCode: payload.currencyCode, rate: payload.rate,
      effectiveAt: payload.effectiveAt, syncedAt: payload.occurredAt,
    });
  }
}
