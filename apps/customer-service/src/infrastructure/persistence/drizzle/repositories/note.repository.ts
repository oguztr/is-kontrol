import { desc, eq } from 'drizzle-orm';
import type { INoteRepository } from '../../../../domain/repositories/note.repository.interface'
import { NoteEntity } from '../../../../domain/entities/note.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { partnerNotes } from '../schema'

export class DrizzleNoteRepository implements INoteRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findById(id: string): Promise<NoteEntity | null> {
    const rows = await this.db
      .select()
      .from(partnerNotes)
      .where(eq(partnerNotes.id, id))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async listByPartner(partnerId: string): Promise<NoteEntity[]> {
    const rows = await this.db
      .select()
      .from(partnerNotes)
      .where(eq(partnerNotes.partnerId, partnerId))
      .orderBy(desc(partnerNotes.pinned), desc(partnerNotes.createdAt), desc(partnerNotes.id));
    return rows.map((row) => this.toEntity(row));
  }

  async save(note: NoteEntity): Promise<void> {
    await this.db.insert(partnerNotes).values({
      id: note.id,
      partnerId: note.partnerId,
      type: note.type,
      content: note.content,
      pinned: note.pinned,
      authorUserId: note.authorUserId,
      createdAt: note.createdAt,
    });
  }

  async update(note: NoteEntity): Promise<void> {
    await this.db.update(partnerNotes).set({
      type: note.type,
      content: note.content,
      pinned: note.pinned,
    }).where(eq(partnerNotes.id, note.id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(partnerNotes).where(eq(partnerNotes.id, id));
  }

  async reassignPartner(fromPartnerId: string, toPartnerId: string): Promise<void> {
    await this.db.update(partnerNotes).set({ partnerId: toPartnerId })
      .where(eq(partnerNotes.partnerId, fromPartnerId));
  }

  private toEntity(row: typeof partnerNotes.$inferSelect): NoteEntity {
    return new NoteEntity({
      id: row.id,
      partnerId: row.partnerId,
      type: row.type,
      content: row.content,
      pinned: row.pinned,
      authorUserId: row.authorUserId ?? null,
      createdAt: row.createdAt,
    });
  }
}
