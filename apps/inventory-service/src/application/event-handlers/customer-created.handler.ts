import type { IBusinessPartnerReferenceRepository } from '../../domain/repositories/business-partner-reference.repository.interface'
import type { InboxEvent } from '../../domain/repositories/inbox.repository.interface'

export class CustomerCreatedHandler {
  constructor(private readonly businessPartnerReferenceRepository: IBusinessPartnerReferenceRepository) {}

  async handle(event: InboxEvent): Promise<void> {
    const payload = event.payload as {
      id: string;
      companyId: string;
      name: string;
    };

    await this.businessPartnerReferenceRepository.upsert({
      id: payload.id,
      companyId: payload.companyId,
      name: payload.name,
      type: 'CUSTOMER',
      isActive: true,
      syncedAt: new Date(),
    });
  }
}
