import { Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import type { IOutboxRepository } from '../../../domain/repositories/outbox.repository.interface'
import type { IUnitOfWorkPort } from '../../../application/ports/unit-of-work.port'
import { KAFKA_CLIENT } from './kafka.module';

const BATCH_SIZE = 50;
const POLL_INTERVAL_MS = 2_000;
const CLAIM_TIMEOUT_MS = 60_000;

// Polls the outbox table and relays unpublished events to Kafka.
// Should be started as a background worker via setInterval in module lifecycle hooks.
export class OutboxPublisherWorker {
  constructor(
    private readonly outboxRepository: IOutboxRepository,
    @Inject(KAFKA_CLIENT) private readonly kafkaClient: ClientKafka,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly workerId: string,
    private running = false,
  ) {}

  async poll(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const staleBefore = new Date(Date.now() - CLAIM_TIMEOUT_MS);
      const events = await this.unitOfWork.run(() =>
        this.outboxRepository.claimUnpublished(
          BATCH_SIZE,
          this.workerId,
          staleBefore,
        ),
      );
      for (const event of events) {
        try {
          // Batch'in sonundaki eventler beklerken lease süresi dolabilir.
          // Publish öncesi yenileme ownership'i fencing kontrolüyle doğrular.
          const stillOwned = await this.outboxRepository.renewClaim(
            event.id,
            this.workerId,
          );
          if (!stillOwned) continue;
          await lastValueFrom(
            this.kafkaClient.emit(event.eventType, {
              key: event.aggregateId,
              value: JSON.stringify(event.payload),
              headers: {
                'event-id': event.id,
                'event-version': '1',
                'source-service': 'inventory-service',
                ...(event.correlationId
                  ? { 'correlation-id': event.correlationId }
                  : {}),
              },
            }),
          );
          await this.outboxRepository.markAsPublished(event.id, this.workerId);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          await this.outboxRepository.releaseClaim(
            event.id,
            this.workerId,
            message,
          );
          console.error(`[OutboxPublisher] ${event.id} gönderilemedi:`, err);
          continue;
        }
      }
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
