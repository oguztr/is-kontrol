import type { ContactEntity } from "../../../../domain/entities/contact.entity";
import { ContactErrors } from "../../../../domain/errors/contact.errors";
import type { ContactError } from "../../../../domain/errors/contact.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { IContactRepository } from "../../../../domain/repositories/contact.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { ListPartnerContactsQuery } from "./list-partner-contacts.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class ListPartnerContactsHandler {
  constructor(
    private readonly partners: IPartnerRepository,
    private readonly contacts: IContactRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: ListPartnerContactsQuery,
  ): Promise<Result<ContactEntity[], ContactError>> {
    const partner = await this.partners.findById(query.partnerId);
    if (!partner || !this.actor.allowsCompany(partner.companyId)) {
      return new Failure(ContactErrors.partnerNotFound(query.partnerId));
    }
    return new Success(await this.contacts.listByPartner(partner.id));
  }
}
