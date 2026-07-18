import type { ContactEntity } from "../../../domain/entities/contact.entity";

export function contactEventPayload(contact: ContactEntity): Record<string, unknown> {
  return {
    id: contact.id,
    partnerId: contact.partnerId,
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    isPrimary: contact.isPrimary,
    occurredAt: new Date().toISOString(),
  };
}
