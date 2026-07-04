import { Injectable } from '@nestjs/common';
import {
  InventoryKafkaTopics,
  type ProductCreatedEvent,
  type StockCreatedEvent,
  type StockMovedEvent,
  type StockReleasedEvent,
  type StockReservedEvent,
} from '@is-kontrol/inventory-contracts';
import { KafkaProducerService } from './kafka-producer.service';

type WithoutOccurredAt<T extends { occurredAt: string }> = Omit<T, 'occurredAt'>;

@Injectable()
export class InventoryEventPublisher {
  constructor(private readonly kafka: KafkaProducerService) {}

  private withTimestamp<T extends { occurredAt: string }>(
    event: WithoutOccurredAt<T>
  ): T {
    return { ...event, occurredAt: new Date().toISOString() } as T;
  }

  productCreated(event: WithoutOccurredAt<ProductCreatedEvent>) {
    return this.kafka.emit(
      InventoryKafkaTopics.PRODUCT_CREATED,
      this.withTimestamp(event)
    );
  }

  stockCreated(event: WithoutOccurredAt<StockCreatedEvent>) {
    return this.kafka.emit(
      InventoryKafkaTopics.STOCK_CREATED,
      this.withTimestamp(event)
    );
  }

  stockMoved(event: WithoutOccurredAt<StockMovedEvent>) {
    return this.kafka.emit(
      InventoryKafkaTopics.STOCK_MOVED,
      this.withTimestamp(event)
    );
  }

  stockReserved(event: WithoutOccurredAt<StockReservedEvent>) {
    return this.kafka.emit(
      InventoryKafkaTopics.STOCK_RESERVED,
      this.withTimestamp(event)
    );
  }

  stockReleased(event: WithoutOccurredAt<StockReleasedEvent>) {
    return this.kafka.emit(
      InventoryKafkaTopics.STOCK_RELEASED,
      this.withTimestamp(event)
    );
  }
}
