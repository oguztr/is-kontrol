import { ContactEntity } from "../../../../domain/entities/contact.entity";
import { ContactErrors } from "../../../../domain/errors/contact.errors";
import type { ContactError } from "../../../../domain/errors/contact.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { IContactRepository } from "../../../../domain/repositories/contact.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { contactEventPayload } from "../contact-event.payload";
import { AddContactCommand } from "./add-contact.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class AddContactHandler {
  constructor(
    private readonly partners: IPartnerRepository,
    private readonly contacts: IContactRepository,
    private readonly eventPublisher: IEventPublisherPort,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: AddContactCommand,
  ): Promise<Result<{ id: string }, ContactError>> {
    const outcome = await this.unitOfWork.run<{ id: string } | ContactError>(
      async () => {
        const partner = await this.partners.findById(command.partnerId);
        if (!partner || !this.actor.allowsCompany(partner.companyId)) {
          return ContactErrors.partnerNotFound(command.partnerId);
        }

        // Yeni kişi birincil geliyorsa mevcut birincil otomatik düşürülür.
        if (command.isPrimary) {
          await this.contacts.clearPrimary(partner.id);
        }
        const contact = new ContactEntity({
          id: crypto.randomUUID(),
          partnerId: partner.id,
          firstName: command.firstName,
          lastName: command.lastName,
          title: command.title,
          department: command.department,
          phone: command.phone,
          email: command.email,
          isPrimary: command.isPrimary,
          createdAt: new Date(),
        });
        await this.contacts.save(contact);

        await this.eventPublisher.publish({
          aggregateType: "Contact",
          aggregateId: contact.id,
          eventType: "contact.created",
          payload: contactEventPayload(contact),
        });
        return { id: contact.id };
      },
    );
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }
}
