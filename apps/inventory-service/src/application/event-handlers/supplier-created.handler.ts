import type { IBusinessPartnerReferenceRepository } from '../../domain/repositories/business-partner-reference.repository.interface'
import type { ConsumedEvent, IConsumedEventHandler } from './consumed-event'

export class SupplierCreatedHandler implements IConsumedEventHandler {
  constructor(private readonly businessPartnerReferenceRepository: IBusinessPartnerReferenceRepository) {}

  async handle(event: ConsumedEvent): Promise<void> {
    const payload = event.payload as {
      id: string;
      companyId: string;
      name: string;
    };

    await this.businessPartnerReferenceRepository.upsert({
      id: payload.id,
      companyId: payload.companyId,
      name: payload.name,
      type: 'SUPPLIER',
      isActive: true,
      syncedAt: new Date(),
    });
  }
}
