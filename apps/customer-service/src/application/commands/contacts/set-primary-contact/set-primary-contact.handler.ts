import { ContactErrors } from "../../../../domain/errors/contact.errors";
import type { ContactError } from "../../../../domain/errors/contact.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { IContactRepository } from "../../../../domain/repositories/contact.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { contactEventPayload } from "../contact-event.payload";
import { SetPrimaryContactCommand } from "./set-primary-contact.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

// Yeni birincil atanınca partnerin önceki birincil kişisi otomatik düşürülür.
export class SetPrimaryContactHandler {
  constructor(
    private readonly partners: IPartnerRepository,
    private readonly contacts: IContactRepository,
    private readonly eventPublisher: IEventPublisherPort,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(command: SetPrimaryContactCommand): Promise<Result<void, ContactError>> {
    const error = await this.unitOfWork.run<ContactError | undefined>(
      async () => {
        const contact = await this.contacts.findById(command.contactId);
        if (!contact) return ContactErrors.notFound(command.contactId);
        const partner = await this.partners.findById(contact.partnerId);
        if (!partner || !this.actor.allowsCompany(partner.companyId)) {
          return ContactErrors.notFound(command.contactId);
        }
        if (contact.isPrimary) return undefined;

        await this.contacts.clearPrimary(contact.partnerId);
        contact.isPrimary = true;
        await this.contacts.update(contact);

        await this.eventPublisher.publish({
          aggregateType: "Contact",
          aggregateId: contact.id,
          eventType: "contact.updated",
          payload: contactEventPayload(contact),
        });
        return undefined;
      },
    );
    return error ? new Failure(error) : new Success(undefined);
  }
}
