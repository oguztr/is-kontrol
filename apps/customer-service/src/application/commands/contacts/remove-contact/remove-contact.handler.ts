import { ContactErrors } from "../../../../domain/errors/contact.errors";
import type { ContactError } from "../../../../domain/errors/contact.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { IContactRepository } from "../../../../domain/repositories/contact.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { RemoveContactCommand } from "./remove-contact.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class RemoveContactHandler {
  constructor(
    private readonly partners: IPartnerRepository,
    private readonly contacts: IContactRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(command: RemoveContactCommand): Promise<Result<void, ContactError>> {
    const error = await this.unitOfWork.run<ContactError | undefined>(
      async () => {
        const contact = await this.contacts.findById(command.contactId);
        if (!contact) return ContactErrors.notFound(command.contactId);
        const partner = await this.partners.findById(contact.partnerId);
        if (!partner || !this.actor.allowsCompany(partner.companyId)) {
          return ContactErrors.notFound(command.contactId);
        }
        await this.contacts.delete(contact.id);
        return undefined;
      },
    );
    return error ? new Failure(error) : new Success(undefined);
  }
}
