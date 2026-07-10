import type { IEventPublisherPort, DomainEvent } from '../../../application/ports/event-publisher.port'
import type { IOutboxRepository } from '../../../domain/repositories/outbox.repository.interface'

// Writes the event to the outbox table (transactional outbox pattern).
// The outbox-publisher.worker picks it up and sends it to Kafka.
export class KafkaEventPublisher implements IEventPublisherPort {
  constructor(private readonly outboxRepository: IOutboxRepository) {}

  async publish(event: DomainEvent): Promise<void> {
    await this.outboxRepository.save({
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      payload: event.payload,
    });
  }
}
