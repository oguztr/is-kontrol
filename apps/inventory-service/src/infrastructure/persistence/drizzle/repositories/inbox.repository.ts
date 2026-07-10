import { eq } from 'drizzle-orm';
import type { IInboxRepository, InboxEvent, InboxStatus } from '../../../../domain/repositories/inbox.repository.interface'
import type { WriteDb } from '../drizzle.provider'
import { inboxEvents } from '../schema'

export class DrizzleInboxRepository implements IInboxRepository {
  constructor(private readonly db: WriteDb) {}

  async save(event: Omit<InboxEvent, 'status' | 'retryCount' | 'lastError' | 'receivedAt' | 'processedAt'>): Promise<void> {
    await this.db.insert(inboxEvents).values({
      id: event.id,
      eventType: event.eventType,
      sourceService: event.sourceService,
      aggregateType: event.aggregateType ?? undefined,
      aggregateId: event.aggregateId ?? undefined,
      payload: event.payload,
      kafkaTopic: event.kafkaTopic ?? undefined,
      kafkaPartition: event.kafkaPartition ?? undefined,
      kafkaOffset: event.kafkaOffset ?? undefined,
    });
  }

  async findPending(limit: number): Promise<InboxEvent[]> {
    const rows = await this.db
      .select()
      .from(inboxEvents)
      .where(eq(inboxEvents.status, 'PENDING'))
      .limit(limit);
    return rows.map((r) => this.toDto(r));
  }

  async markAsProcessing(id: string): Promise<void> {
    await this.db.update(inboxEvents).set({ status: 'PROCESSING' }).where(eq(inboxEvents.id, id));
  }

  async markAsProcessed(id: string): Promise<void> {
    await this.db
      .update(inboxEvents)
      .set({ status: 'PROCESSED', processedAt: new Date() })
      .where(eq(inboxEvents.id, id));
  }

  async markAsFailed(id: string, error: string): Promise<void> {
    await this.db
      .update(inboxEvents)
      .set({ status: 'FAILED', lastError: error })
      .where(eq(inboxEvents.id, id));
  }

  private toDto(row: typeof inboxEvents.$inferSelect): InboxEvent {
    return {
      id: row.id,
      eventType: row.eventType,
      sourceService: row.sourceService,
      aggregateType: row.aggregateType ?? null,
      aggregateId: row.aggregateId ?? null,
      payload: row.payload as Record<string, unknown>,
      status: row.status as InboxStatus,
      retryCount: row.retryCount,
      lastError: row.lastError ?? null,
      kafkaTopic: row.kafkaTopic ?? null,
      kafkaPartition: row.kafkaPartition ?? null,
      kafkaOffset: row.kafkaOffset ?? null,
      receivedAt: row.receivedAt,
      processedAt: row.processedAt ?? null,
    };
  }
}
