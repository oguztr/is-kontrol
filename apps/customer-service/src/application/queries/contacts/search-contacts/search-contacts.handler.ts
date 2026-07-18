import type { ContactEntity } from "../../../../domain/entities/contact.entity";
import { ContactErrors } from "../../../../domain/errors/contact.errors";
import type { ContactError } from "../../../../domain/errors/contact.errors";
import type { IContactRepository } from "../../../../domain/repositories/contact.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { SearchContactsQuery } from "./search-contacts.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

/* Telefon/e-posta ile çapraz arama: "bu numara hangi partnere ait?"
 * sorusuna kişi kaydı üzerinden cevap verir. */
export class SearchContactsHandler {
  constructor(
    private readonly contacts: IContactRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: SearchContactsQuery,
  ): Promise<Result<ContactEntity[], ContactError>> {
    if (!this.actor.allowsCompany(query.companyId)) {
      return new Failure(ContactErrors.partnerNotFound(query.companyId));
    }
    return new Success(
      await this.contacts.search({
        companyId: query.companyId,
        phone: query.phone,
        email: query.email,
      }),
    );
  }
}
