import type { ICompanyReferenceRepository } from "../../domain/repositories/company-reference.repository.interface";
import type { ConsumedEvent, IConsumedEventHandler } from "./consumed-event";

export class CompanyStatusChangedHandler implements IConsumedEventHandler {
  constructor(private readonly repository: ICompanyReferenceRepository) {}

  async handle(event: ConsumedEvent): Promise<void> {
    const payload = event.payload as { id: string; isActive: boolean; occurredAt: Date };
    await this.repository.setActive(payload.id, payload.isActive, payload.occurredAt);
  }
}
