import type { NoteType } from "../../../../domain/entities/note.entity";

export class UpdateNoteCommand {
  constructor(
    public readonly noteId: string,
    public readonly type: NoteType,
    public readonly content: string,
  ) {}
}
