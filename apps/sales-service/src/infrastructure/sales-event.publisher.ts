import { Injectable } from '@nestjs/common';
import {
  SalesKafkaTopics,
  type QuoteCreatedEvent,
  type QuoteSentEvent,
  type QuoteAcceptedEvent,
  type QuoteRejectedEvent,
  type OrderCreatedEvent,
  type OrderConfirmedEvent,
  type OrderShippedEvent,
  type OrderCancelledEvent,
  type OrderCompletedEvent,
} from '@is-kontrol/sales-contracts';
import { KafkaProducerService } from './kafka-producer.service';

type WithoutOccurredAt<T extends { occurredAt: string }> = Omit<T, 'occurredAt'>;

@Injectable()
export class SalesEventPublisher {
  constructor(private readonly kafka: KafkaProducerService) {}

  private withTimestamp<T extends { occurredAt: string }>(
    event: WithoutOccurredAt<T>
  ): T {
    return { ...event, occurredAt: new Date().toISOString() } as T;
  }

  quoteCreated(event: WithoutOccurredAt<QuoteCreatedEvent>) {
    return this.kafka.emit(
      SalesKafkaTopics.QUOTE_CREATED,
      this.withTimestamp(event)
    );
  }

  quoteSent(event: WithoutOccurredAt<QuoteSentEvent>) {
    return this.kafka.emit(
      SalesKafkaTopics.QUOTE_SENT,
      this.withTimestamp(event)
    );
  }

  quoteAccepted(event: WithoutOccurredAt<QuoteAcceptedEvent>) {
    return this.kafka.emit(
      SalesKafkaTopics.QUOTE_ACCEPTED,
      this.withTimestamp(event)
    );
  }

  quoteRejected(event: WithoutOccurredAt<QuoteRejectedEvent>) {
    return this.kafka.emit(
      SalesKafkaTopics.QUOTE_REJECTED,
      this.withTimestamp(event)
    );
  }

  orderCreated(event: WithoutOccurredAt<OrderCreatedEvent>) {
    return this.kafka.emit(
      SalesKafkaTopics.ORDER_CREATED,
      this.withTimestamp(event)
    );
  }

  orderConfirmed(event: WithoutOccurredAt<OrderConfirmedEvent>) {
    return this.kafka.emit(
      SalesKafkaTopics.ORDER_CONFIRMED,
      this.withTimestamp(event)
    );
  }

  orderShipped(event: WithoutOccurredAt<OrderShippedEvent>) {
    return this.kafka.emit(
      SalesKafkaTopics.ORDER_SHIPPED,
      this.withTimestamp(event)
    );
  }

  orderCancelled(event: WithoutOccurredAt<OrderCancelledEvent>) {
    return this.kafka.emit(
      SalesKafkaTopics.ORDER_CANCELLED,
      this.withTimestamp(event)
    );
  }

  orderCompleted(event: WithoutOccurredAt<OrderCompletedEvent>) {
    return this.kafka.emit(
      SalesKafkaTopics.ORDER_COMPLETED,
      this.withTimestamp(event)
    );
  }
}
