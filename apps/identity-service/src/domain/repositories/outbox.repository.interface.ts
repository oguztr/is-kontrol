export interface OutboxEvent {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  correlationId: string | null;
  createdAt: Date;
  publishedAt: Date | null;
}

export interface IOutboxRepository {
  save(event: Omit<OutboxEvent, 'id' | 'createdAt' | 'publishedAt'>): Promise<void>;
  claimUnpublished(
    limit: number,
    claimedBy: string,
    staleBefore: Date,
  ): Promise<OutboxEvent[]>;
  markAsPublished(id: string, claimedBy: string): Promise<void>;
  renewClaim(id: string, claimedBy: string): Promise<boolean>;
  releaseClaim(id: string, claimedBy: string, error: string): Promise<void>;
}
