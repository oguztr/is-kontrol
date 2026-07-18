import type { PartnerEntity } from "../../../../domain/entities/partner.entity";
import type { CompanyProfileEntity } from "../../../../domain/entities/company-profile.entity";
import type { ContactEntity } from "../../../../domain/entities/contact.entity";
import type { AddressEntity } from "../../../../domain/entities/address.entity";
import type { NoteEntity } from "../../../../domain/entities/note.entity";
import { PartnerErrors } from "../../../../domain/errors/partner.errors";
import type { PartnerError } from "../../../../domain/errors/partner.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { ICompanyProfileRepository } from "../../../../domain/repositories/company-profile.repository.interface";
import type { IContactRepository } from "../../../../domain/repositories/contact.repository.interface";
import type { IAddressRepository } from "../../../../domain/repositories/address.repository.interface";
import type { INoteRepository } from "../../../../domain/repositories/note.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { GetPartnerQuery } from "./get-partner.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

/** 360° görünüm: partner çekirdeği + firma + kişiler + adresler + notlar. */
export interface PartnerDetailView {
  partner: PartnerEntity;
  companyProfile: CompanyProfileEntity | null;
  contacts: ContactEntity[];
  addresses: AddressEntity[];
  notes: NoteEntity[];
}

export class GetPartnerHandler {
  constructor(
    private readonly partners: IPartnerRepository,
    private readonly companyProfiles: ICompanyProfileRepository,
    private readonly contacts: IContactRepository,
    private readonly addresses: IAddressRepository,
    private readonly notes: INoteRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetPartnerQuery,
  ): Promise<Result<PartnerDetailView, PartnerError>> {
    const partner = await this.partners.findById(query.partnerId);
    if (!partner || !this.actor.allowsCompany(partner.companyId)) {
      return new Failure(PartnerErrors.notFound(query.partnerId));
    }
    const [companyProfile, contacts, addresses, notes] = await Promise.all([
      this.companyProfiles.findByPartnerId(partner.id),
      this.contacts.listByPartner(partner.id),
      this.addresses.listByPartner(partner.id),
      this.notes.listByPartner(partner.id),
    ]);
    return new Success({ partner, companyProfile, contacts, addresses, notes });
  }
}
