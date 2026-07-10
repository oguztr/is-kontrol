export type InboxStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';

export interface InboxEvent {
  id: string;
  eventType: string;
  sourceService: string;
  aggregateType: string | null;
  aggregateId: string | null;
  payload: Record<string, unknown>;
  status: InboxStatus;
  retryCount: number;
  lastError: string | null;
  kafkaTopic: string | null;
  kafkaPartition: number | null;
  kafkaOffset: string | null;
  receivedAt: Date;
  processedAt: Date | null;
}

export interface IInboxRepository {
  save(event: Omit<InboxEvent, 'status' | 'retryCount' | 'lastError' | 'receivedAt' | 'processedAt'>): Promise<void>;
  findPending(limit: number): Promise<InboxEvent[]>;
  markAsProcessing(id: string): Promise<void>;
  markAsProcessed(id: string): Promise<void>;
  markAsFailed(id: string, error: string): Promise<void>;
}
