import type { IEventPublisherPort, DomainEvent } from '../../../application/ports/event-publisher.port'
import type { IOutboxRepository } from '../../../domain/repositories/outbox.repository.interface'
import { CorrelationContext } from '../../correlation/correlation-context'

// Event'i outbox tablosuna yazar (transactional outbox pattern); outbox
// publisher worker'ı NOTIFY ile uyanıp Kafka'ya aktarır. Aktif correlation
// ID (HTTP isteği veya tüketilen mesajdan) event'e işlenir.
export class KafkaEventPublisher implements IEventPublisherPort {
  constructor(
    private readonly outboxRepository: IOutboxRepository,
    private readonly correlation: CorrelationContext,
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    await this.outboxRepository.save({
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      payload: event.payload,
      correlationId: this.correlation.current() ?? null,
    });
  }
}
