import { and, asc, eq, inArray, isNull, lt, notExists, or, sql } from 'drizzle-orm';
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

  // Kısa transaction içinde eventleri lease ile claim eder. Kafka network
  // çağrısı transaction dışında yapılır; crash olan claim'ler staleBefore
  // sonrası yeniden alınabilir.
  async claimUnpublished(
    limit: number,
    claimedBy: string,
    staleBefore: Date,
  ): Promise<OutboxEvent[]> {
    const earlier = alias(outboxEvents, 'earlier_outbox_event');
    const rows = await this.db
      .select()
      .from(outboxEvents)
      .where(
        and(
          isNull(outboxEvents.publishedAt),
          or(
            isNull(outboxEvents.claimedAt),
            lt(outboxEvents.claimedAt, staleBefore),
          ),
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
    if (rows.length === 0) return [];

    await this.db
      .update(outboxEvents)
      .set({
        claimedBy,
        claimedAt: new Date(),
        attemptCount: sql`${outboxEvents.attemptCount} + 1`,
        lastError: null,
      })
      .where(inArray(outboxEvents.id, rows.map((row) => row.id)));

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

  async markAsPublished(id: string, claimedBy: string): Promise<void> {
    await this.db
      .update(outboxEvents)
      .set({
        publishedAt: new Date(),
        claimedBy: null,
        claimedAt: null,
        lastError: null,
      })
      .where(and(eq(outboxEvents.id, id), eq(outboxEvents.claimedBy, claimedBy)));
  }

  async renewClaim(id: string, claimedBy: string): Promise<boolean> {
    const renewed = await this.db
      .update(outboxEvents)
      .set({ claimedAt: new Date() })
      .where(and(eq(outboxEvents.id, id), eq(outboxEvents.claimedBy, claimedBy)))
      .returning({ id: outboxEvents.id });
    return renewed.length > 0;
  }

  async releaseClaim(id: string, claimedBy: string, error: string): Promise<void> {
    await this.db
      .update(outboxEvents)
      .set({ claimedBy: null, claimedAt: null, lastError: error })
      .where(and(eq(outboxEvents.id, id), eq(outboxEvents.claimedBy, claimedBy)));
  }
}
