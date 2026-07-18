export type NoteType = "NOTE" | "CALL" | "MEETING" | "EMAIL";

export class NoteEntity {
  public readonly id: string;
  public partnerId: string;
  public type: NoteType;
  public content: string;
  public pinned: boolean;
  public readonly authorUserId: string | null;
  public readonly createdAt: Date;

  constructor(params: {
    id: string;
    partnerId: string;
    type: NoteType;
    content: string;
    pinned: boolean;
    authorUserId: string | null;
    createdAt: Date;
  }) {
    this.id = params.id;
    this.partnerId = params.partnerId;
    this.type = params.type;
    this.content = params.content;
    this.pinned = params.pinned;
    this.authorUserId = params.authorUserId;
    this.createdAt = params.createdAt;
  }

  /** Yazarı olmayan (sistem) notlar herkes tarafından düzenlenebilir. */
  canBeEditedBy(userId: string | null): boolean {
    if (!userId || !this.authorUserId) return true;
    return this.authorUserId === userId;
  }
}
