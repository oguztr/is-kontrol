import type { NoteEntity } from "../entities/note.entity";

export interface INoteRepository {
  findById(id: string): Promise<NoteEntity | null>;
  /** Sabitlenmişler önce, sonrası yeniden eskiye kronolojik. */
  listByPartner(partnerId: string): Promise<NoteEntity[]>;
  save(note: NoteEntity): Promise<void>;
  update(note: NoteEntity): Promise<void>;
  delete(id: string): Promise<void>;
  reassignPartner(fromPartnerId: string, toPartnerId: string): Promise<void>;
}
