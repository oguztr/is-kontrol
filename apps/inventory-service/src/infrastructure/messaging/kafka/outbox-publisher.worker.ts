import { Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import type { IOutboxRepository } from '../../../domain/repositories/outbox.repository.interface'
import { KAFKA_CLIENT } from './kafka.module';

const BATCH_SIZE = 50;
const POLL_INTERVAL_MS = 2_000;

// Polls the outbox table and relays unpublished events to Kafka.
// Should be started as a background worker via setInterval in module lifecycle hooks.
export class OutboxPublisherWorker {
  constructor(
    private readonly outboxRepository: IOutboxRepository,
    @Inject(KAFKA_CLIENT) private readonly kafkaClient: ClientKafka,
  ) {}

  async poll(): Promise<void> {
    const events = await this.outboxRepository.findUnpublished(BATCH_SIZE);
    for (const event of events) {
      try {
        await this.kafkaClient.emit(event.eventType, {
          key: event.aggregateId,
          value: JSON.stringify(event.payload),
        }).toPromise();
        await this.outboxRepository.markAsPublished(event.id);
      } catch (err) {
        // Hatayı logla ama döngüyü kırma; bir sonraki iterasyonda tekrar denenecek
        console.error(`[OutboxPublisher] ${event.id} gönderilemedi:`, err);
      }
    }
  }

  start(): NodeJS.Timeout {
    return setInterval(() => this.poll(), POLL_INTERVAL_MS);
  }
}
