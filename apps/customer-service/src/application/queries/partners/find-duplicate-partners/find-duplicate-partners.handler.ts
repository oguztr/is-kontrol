import { PartnerErrors } from "../../../../domain/errors/partner.errors";
import type { PartnerError } from "../../../../domain/errors/partner.errors";
import type { ICompanyProfileRepository } from "../../../../domain/repositories/company-profile.repository.interface";
import type { IContactRepository } from "../../../../domain/repositories/contact.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { FindDuplicatePartnersQuery } from "./find-duplicate-partners.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

/** Mükerrer aday grubu: aynı anahtar değeri paylaşan partner id'leri. */
export interface DuplicateGroup {
  criterion: "TAX_NUMBER" | "CONTACT_EMAIL";
  value: string;
  partnerIds: string[];
}

/* Mükerrer tespiti: aynı vergi numarası ya da aynı iletişim e-postasını
 * paylaşan partnerler gruplanır; birleştirme kararı kullanıcıya bırakılır
 * (merge ucu ile). */
export class FindDuplicatePartnersHandler {
  constructor(
    private readonly companyProfiles: ICompanyProfileRepository,
    private readonly contacts: IContactRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: FindDuplicatePartnersQuery,
  ): Promise<Result<DuplicateGroup[], PartnerError>> {
    if (!this.actor.allowsCompany(query.companyId)) {
      return new Failure(PartnerErrors.companyNotFound(query.companyId));
    }
    const [taxDuplicates, emailDuplicates] = await Promise.all([
      this.companyProfiles.listTaxNumberDuplicates(query.companyId),
      this.contacts.listEmailDuplicates(query.companyId),
    ]);
    return new Success([
      ...taxDuplicates.map<DuplicateGroup>((group) => ({
        criterion: "TAX_NUMBER",
        value: group.taxNumber,
        partnerIds: group.partnerIds,
      })),
      ...emailDuplicates.map<DuplicateGroup>((group) => ({
        criterion: "CONTACT_EMAIL",
        value: group.email,
        partnerIds: group.partnerIds,
      })),
    ]);
  }
}
