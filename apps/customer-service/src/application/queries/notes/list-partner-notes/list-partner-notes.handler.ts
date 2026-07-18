import type { NoteEntity } from "../../../../domain/entities/note.entity";
import { NoteErrors } from "../../../../domain/errors/note.errors";
import type { NoteError } from "../../../../domain/errors/note.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { INoteRepository } from "../../../../domain/repositories/note.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { ListPartnerNotesQuery } from "./list-partner-notes.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class ListPartnerNotesHandler {
  constructor(
    private readonly partners: IPartnerRepository,
    private readonly notes: INoteRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: ListPartnerNotesQuery,
  ): Promise<Result<NoteEntity[], NoteError>> {
    const partner = await this.partners.findById(query.partnerId);
    if (!partner || !this.actor.allowsCompany(partner.companyId)) {
      return new Failure(NoteErrors.partnerNotFound(query.partnerId));
    }
    return new Success(await this.notes.listByPartner(partner.id));
  }
}
