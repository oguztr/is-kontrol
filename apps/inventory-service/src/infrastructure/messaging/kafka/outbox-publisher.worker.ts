import { Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import type { IOutboxRepository } from '../../../domain/repositories/outbox.repository.interface'
import type { IUnitOfWorkPort } from '../../../application/ports/unit-of-work.port'
import { KAFKA_CLIENT } from './kafka.module';

const BATCH_SIZE = 50;
const POLL_INTERVAL_MS = 2_000;

// Polls the outbox table and relays unpublished events to Kafka.
// Should be started as a background worker via setInterval in module lifecycle hooks.
export class OutboxPublisherWorker {
  private running = false;

  constructor(
    private readonly outboxRepository: IOutboxRepository,
    @Inject(KAFKA_CLIENT) private readonly kafkaClient: ClientKafka,
    private readonly unitOfWork: IUnitOfWorkPort,
  ) {}

  async poll(): Promise<void> {
    if (this.running) return;
    this.running = true;
    // Batch tek transaction'da işlenir: findUnpublished satırları FOR UPDATE
    // SKIP LOCKED ile kilitler, böylece paralel instance'lar aynı event'i
    // yayınlamaz. Kilit commit'e kadar durur.
    try {
      await this.unitOfWork.run(async () => {
        const events = await this.outboxRepository.findUnpublished(BATCH_SIZE);
        for (const event of events) {
          try {
            await lastValueFrom(
              this.kafkaClient.emit(event.eventType, {
                key: event.aggregateId,
                value: JSON.stringify(event.payload),
                headers: {
                  'event-id': event.id,
                  'event-version': '1',
                  'source-service': 'inventory-service',
                },
              }),
            );
            await this.outboxRepository.markAsPublished(event.id);
          } catch (err) {
            console.error(`[OutboxPublisher] ${event.id} gönderilemedi:`, err);
            break;
          }
        }
      });
    } finally {
      this.running = false;
    }
  }

  start(): NodeJS.Timeout {
    return setInterval(() => {
      this.poll().catch((err) => console.error('[OutboxPublisher] poll hatası:', err));
    }, POLL_INTERVAL_MS);
  }
}
