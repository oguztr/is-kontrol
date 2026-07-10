export interface OutboxEvent {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: Date;
  publishedAt: Date | null;
}

export interface IOutboxRepository {
  save(event: Omit<OutboxEvent, 'id' | 'createdAt' | 'publishedAt'>): Promise<void>;
  findUnpublished(limit: number): Promise<OutboxEvent[]>;
  markAsPublished(id: string): Promise<void>;
}
