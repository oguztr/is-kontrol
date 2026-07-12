import type { ICompanyReferenceRepository } from '../../domain/repositories/company-reference.repository.interface'
import type { ConsumedEvent, IConsumedEventHandler } from './consumed-event'

export class CompanyCreatedHandler implements IConsumedEventHandler {
  constructor(private readonly companyReferenceRepository: ICompanyReferenceRepository) {}

  async handle(event: ConsumedEvent): Promise<void> {
    const payload = event.payload as {
      id: string;
      name: string;
      baseCurrencyCode: string;
    };

    await this.companyReferenceRepository.upsert({
      id: payload.id,
      name: payload.name,
      baseCurrencyCode: payload.baseCurrencyCode,
      isActive: true,
      syncedAt: new Date(),
    });
  }
}
