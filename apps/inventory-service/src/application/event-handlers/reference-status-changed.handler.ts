import type { IBusinessPartnerReferenceRepository } from "../../domain/repositories/business-partner-reference.repository.interface";
import type { ICompanyReferenceRepository } from "../../domain/repositories/company-reference.repository.interface";
import type { ICurrencyReferenceRepository } from "../../domain/repositories/currency-reference.repository.interface";
import type { ConsumedEvent, IConsumedEventHandler } from "./consumed-event";

function status(event: ConsumedEvent): { id: string; isActive: boolean; occurredAt: Date } {
  return event.payload as { id: string; isActive: boolean; occurredAt: Date };
}

export class CompanyReferenceStatusChangedHandler implements IConsumedEventHandler {
  constructor(private readonly repository: ICompanyReferenceRepository) {}
  async handle(event: ConsumedEvent): Promise<void> {
    const payload = status(event);
    await this.repository.setActive(payload.id, payload.isActive, payload.occurredAt);
  }
}

export class CurrencyReferenceStatusChangedHandler implements IConsumedEventHandler {
  constructor(private readonly repository: ICurrencyReferenceRepository) {}
  async handle(event: ConsumedEvent): Promise<void> {
    const payload = status(event);
    await this.repository.setActive(payload.id, payload.isActive, payload.occurredAt);
  }
}

export class BusinessPartnerReferenceStatusChangedHandler implements IConsumedEventHandler {
  constructor(private readonly repository: IBusinessPartnerReferenceRepository) {}
  async handle(event: ConsumedEvent): Promise<void> {
    const payload = status(event);
    await this.repository.setActive(payload.id, payload.isActive, payload.occurredAt);
  }
}
