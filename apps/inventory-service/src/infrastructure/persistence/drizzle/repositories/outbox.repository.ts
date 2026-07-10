import { isNull, eq } from 'drizzle-orm';
import type { IOutboxRepository, OutboxEvent } from '../../../../domain/repositories/outbox.repository.interface'
import type { WriteDb } from '../drizzle.provider'
import { outboxEvents } from '../schema'

export class DrizzleOutboxRepository implements IOutboxRepository {
  constructor(private readonly db: WriteDb) {}

  async save(event: Omit<OutboxEvent, 'id' | 'createdAt' | 'publishedAt'>): Promise<void> {
    await this.db.insert(outboxEvents).values({
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      payload: event.payload,
    });
  }

  async findUnpublished(limit: number): Promise<OutboxEvent[]> {
    const rows = await this.db
      .select()
      .from(outboxEvents)
      .where(isNull(outboxEvents.publishedAt))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      aggregateType: r.aggregateType,
      aggregateId: r.aggregateId,
      eventType: r.eventType,
      payload: r.payload as Record<string, unknown>,
      createdAt: r.createdAt,
      publishedAt: r.publishedAt ?? null,
    }));
  }

  async markAsPublished(id: string): Promise<void> {
    await this.db.update(outboxEvents).set({ publishedAt: new Date() }).where(eq(outboxEvents.id, id));
  }
}
