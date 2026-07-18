import { NoteErrors } from "../../../../domain/errors/note.errors";
import type { NoteError } from "../../../../domain/errors/note.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { INoteRepository } from "../../../../domain/repositories/note.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { PinNoteCommand } from "./pin-note.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

// Sabitleme yazar kısıtına tabi değildir; kronolojide üstte tutma aracıdır.
export class PinNoteHandler {
  constructor(
    private readonly partners: IPartnerRepository,
    private readonly notes: INoteRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(command: PinNoteCommand): Promise<Result<void, NoteError>> {
    const error = await this.unitOfWork.run<NoteError | undefined>(
      async () => {
        const note = await this.notes.findById(command.noteId);
        if (!note) return NoteErrors.notFound(command.noteId);
        const partner = await this.partners.findById(note.partnerId);
        if (!partner || !this.actor.allowsCompany(partner.companyId)) {
          return NoteErrors.notFound(command.noteId);
        }
        if (note.pinned === command.pinned) return undefined;
        note.pinned = command.pinned;
        await this.notes.update(note);
        return undefined;
      },
    );
    return error ? new Failure(error) : new Success(undefined);
  }
}
