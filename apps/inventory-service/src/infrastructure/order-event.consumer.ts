import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { HandleOrderEventUseCase } from '../use-cases/handle-order-event.use-case';
import {
  ConsumedSalesTopics,
  type OrderCancelledEvent,
  type OrderConfirmedEvent,
  type OrderCreatedEvent,
  type OrderShippedEvent,
} from './consumed-sales.events';

@Controller()
export class OrderEventConsumer {
  private readonly logger = new Logger(OrderEventConsumer.name);

  constructor(private readonly handleOrderEvent: HandleOrderEventUseCase) {}

  @EventPattern(ConsumedSalesTopics.ORDER_CREATED)
  onOrderCreated(@Payload() event: OrderCreatedEvent) {
    this.logger.log(`order.created alındı: ${event.orderId}`);
    return this.handleOrderEvent.onCreated(event);
  }

  @EventPattern(ConsumedSalesTopics.ORDER_CONFIRMED)
  onOrderConfirmed(@Payload() event: OrderConfirmedEvent) {
    this.logger.log(`order.confirmed alındı: ${event.orderId}`);
    return this.handleOrderEvent.onConfirmed(event);
  }

  @EventPattern(ConsumedSalesTopics.ORDER_SHIPPED)
  onOrderShipped(@Payload() event: OrderShippedEvent) {
    this.logger.log(`order.shipped alındı: ${event.orderId}`);
    return this.handleOrderEvent.onShipped(event);
  }

  @EventPattern(ConsumedSalesTopics.ORDER_CANCELLED)
  onOrderCancelled(@Payload() event: OrderCancelledEvent) {
    this.logger.log(`order.cancelled alındı: ${event.orderId}`);
    return this.handleOrderEvent.onCancelled(event);
  }
}
