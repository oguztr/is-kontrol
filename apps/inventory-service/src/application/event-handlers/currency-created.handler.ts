import type { ICurrencyReferenceRepository } from '../../domain/repositories/currency-reference.repository.interface'
import type { InboxEvent } from '../../domain/repositories/inbox.repository.interface'

export class CurrencyCreatedHandler {
  constructor(private readonly currencyReferenceRepository: ICurrencyReferenceRepository) {}

  async handle(event: InboxEvent): Promise<void> {
    const payload = event.payload as {
      id: string;
      code: string;
      name: string;
      decimalPlaces: number;
    };

    await this.currencyReferenceRepository.upsert({
      id: payload.id,
      code: payload.code,
      name: payload.name,
      decimalPlaces: payload.decimalPlaces,
      isActive: true,
      syncedAt: new Date(),
    });
  }
}
