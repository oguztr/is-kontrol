import type { NoteType } from "../../../../domain/entities/note.entity";

export class AddNoteCommand {
  constructor(
    public readonly partnerId: string,
    public readonly type: NoteType,
    public readonly content: string,
    public readonly pinned: boolean,
  ) {}
}
