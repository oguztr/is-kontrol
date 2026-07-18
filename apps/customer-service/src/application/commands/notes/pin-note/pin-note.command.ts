export class PinNoteCommand {
  constructor(
    public readonly noteId: string,
    public readonly pinned: boolean,
  ) {}
}
