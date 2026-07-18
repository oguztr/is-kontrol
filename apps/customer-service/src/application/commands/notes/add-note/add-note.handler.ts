import { NoteEntity } from "../../../../domain/entities/note.entity";
import { NoteErrors } from "../../../../domain/errors/note.errors";
import type { NoteError } from "../../../../domain/errors/note.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { INoteRepository } from "../../../../domain/repositories/note.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { AddNoteCommand } from "./add-note.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class AddNoteHandler {
  constructor(
    private readonly partners: IPartnerRepository,
    private readonly notes: INoteRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: AddNoteCommand,
  ): Promise<Result<{ id: string }, NoteError>> {
    const outcome = await this.unitOfWork.run<{ id: string } | NoteError>(
      async () => {
        const partner = await this.partners.findById(command.partnerId);
        if (!partner || !this.actor.allowsCompany(partner.companyId)) {
          return NoteErrors.partnerNotFound(command.partnerId);
        }
        const note = new NoteEntity({
          id: crypto.randomUUID(),
          partnerId: partner.id,
          type: command.type,
          content: command.content,
          pinned: command.pinned,
          authorUserId: this.actor.userId(),
          createdAt: new Date(),
        });
        await this.notes.save(note);
        return { id: note.id };
      },
    );
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }
}
