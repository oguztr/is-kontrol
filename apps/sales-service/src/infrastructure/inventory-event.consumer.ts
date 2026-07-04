import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { HandleInventoryEventUseCase } from '../use-cases/handle-inventory-event.use-case';
import {
  ConsumedInventoryTopics,
  type StockReservedEvent,
  type StockReleasedEvent,
} from './consumed-inventory.events';

@Controller()
export class InventoryEventConsumer {
  private readonly logger = new Logger(InventoryEventConsumer.name);

  constructor(
    private readonly handleInventoryEvent: HandleInventoryEventUseCase
  ) {}

  @EventPattern(ConsumedInventoryTopics.STOCK_RESERVED)
  onStockReserved(@Payload() event: StockReservedEvent) {
    this.logger.log(`stock.reserved alındı: ${event.productId}`);
    return this.handleInventoryEvent.onStockReserved(event);
  }

  @EventPattern(ConsumedInventoryTopics.STOCK_RELEASED)
  onStockReleased(@Payload() event: StockReleasedEvent) {
    this.logger.log(`stock.released alındı: ${event.productId}`);
    return this.handleInventoryEvent.onStockReleased(event);
  }
}
