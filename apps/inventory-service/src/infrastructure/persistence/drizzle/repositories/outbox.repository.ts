import { and, asc, eq, isNull, lt, notExists, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { IOutboxRepository, OutboxEvent } from '../../../../domain/repositories/outbox.repository.interface'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { outboxEvents } from '../schema'

export class DrizzleOutboxRepository implements IOutboxRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async save(event: Omit<OutboxEvent, 'id' | 'createdAt' | 'publishedAt'>): Promise<void> {
    await this.db.insert(outboxEvents).values({
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      payload: event.payload,
    });
  }

  // Üretim sırasına göre döner; satırları kilitler (SKIP LOCKED) ki birden çok
  // instance aynı event'i aynı anda yayınlamasın. Transaction içinde çağrılmalı.
  async findUnpublished(limit: number): Promise<OutboxEvent[]> {
    const earlier = alias(outboxEvents, 'earlier_outbox_event');
    const rows = await this.db
      .select()
      .from(outboxEvents)
      .where(
        and(
          isNull(outboxEvents.publishedAt),
          // Aynı aggregate'in daha eski yayımlanmamış eventi varsa yenisi
          // eligible değildir. Kilitli eski satır MVCC ile görülmeye devam
          // ettiğinden SKIP LOCKED çoklu instance'ta sırayı bozamaz.
          notExists(
            this.db
              .select({ id: earlier.id })
              .from(earlier)
              .where(
                and(
                  eq(earlier.aggregateType, outboxEvents.aggregateType),
                  eq(earlier.aggregateId, outboxEvents.aggregateId),
                  isNull(earlier.publishedAt),
                  or(
                    lt(earlier.createdAt, outboxEvents.createdAt),
                    and(
                      eq(earlier.createdAt, outboxEvents.createdAt),
                      lt(earlier.id, outboxEvents.id),
                    ),
                  ),
                ),
              ),
          ),
        ),
      )
      .orderBy(asc(outboxEvents.createdAt), asc(outboxEvents.id))
      .limit(limit)
      .for('update', { skipLocked: true });
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
