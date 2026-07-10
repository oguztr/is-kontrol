import type { IInboxRepository } from '../../../domain/repositories/inbox.repository.interface'

export interface KafkaMessage {
  topic: string;
  partition: number;
  offset: string;
  key: string | null;
  value: string;
  headers?: Record<string, string>;
}

// Kafka consumer entry point — writes raw messages to the inbox table.
// The inbox-processor.worker then picks them up and dispatches to application/event-handlers.
export class InboxWriter {
  constructor(private readonly inboxRepository: IInboxRepository) {}

  async write(message: KafkaMessage): Promise<void> {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(message.value) as Record<string, unknown>;
    } catch {
      console.error(`[InboxWriter] JSON parse hatası — topic: ${message.topic}, offset: ${message.offset}`);
      return;
    }

    const id = (payload['id'] as string | undefined) ?? crypto.randomUUID();
    const eventType = (payload['eventType'] as string | undefined) ?? message.topic;
    const sourceService = (message.headers?.['source-service']) ?? 'unknown';

    await this.inboxRepository.save({
      id,
      eventType,
      sourceService,
      aggregateType: (payload['aggregateType'] as string | undefined) ?? null,
      aggregateId: (payload['aggregateId'] as string | undefined) ?? null,
      payload,
      kafkaTopic: message.topic,
      kafkaPartition: message.partition,
      kafkaOffset: message.offset,
    });
  }
}
