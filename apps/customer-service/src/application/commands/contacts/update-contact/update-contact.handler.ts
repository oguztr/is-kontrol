import { ContactErrors } from "../../../../domain/errors/contact.errors";
import type { ContactError } from "../../../../domain/errors/contact.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { IContactRepository } from "../../../../domain/repositories/contact.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { contactEventPayload } from "../contact-event.payload";
import { UpdateContactCommand } from "./update-contact.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class UpdateContactHandler {
  constructor(
    private readonly partners: IPartnerRepository,
    private readonly contacts: IContactRepository,
    private readonly eventPublisher: IEventPublisherPort,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(command: UpdateContactCommand): Promise<Result<void, ContactError>> {
    const error = await this.unitOfWork.run<ContactError | undefined>(
      async () => {
        const contact = await this.contacts.findById(command.contactId);
        if (!contact) return ContactErrors.notFound(command.contactId);
        const partner = await this.partners.findById(contact.partnerId);
        if (!partner || !this.actor.allowsCompany(partner.companyId)) {
          return ContactErrors.notFound(command.contactId);
        }

        contact.firstName = command.firstName;
        contact.lastName = command.lastName;
        contact.title = command.title;
        contact.department = command.department;
        contact.phone = command.phone;
        contact.email = command.email;
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
