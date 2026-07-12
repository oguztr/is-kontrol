import type { IBusinessPartnerReferenceRepository } from "../../domain/repositories/business-partner-reference.repository.interface";
import type { ConsumedEvent, IConsumedEventHandler } from "./consumed-event";

export class BusinessPartnerSyncedHandler implements IConsumedEventHandler {
  constructor(private readonly repository: IBusinessPartnerReferenceRepository) {}
  async handle(event: ConsumedEvent): Promise<void> {
    const payload = event.payload as {
      id: string; companyId: string; name: string;
      type: "SUPPLIER" | "CUSTOMER" | "BOTH";
      isActive: boolean; occurredAt: Date;
    };
    await this.repository.upsert({
      id: payload.id, companyId: payload.companyId, name: payload.name,
      type: payload.type, isActive: payload.isActive, syncedAt: payload.occurredAt,
    });
  }
}
