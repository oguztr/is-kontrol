import { Injectable } from '@nestjs/common';
import { SalesEventPublisher } from '../infrastructure/sales-event.publisher';

@Injectable()
export class ShipOrderUseCase {
  constructor(private readonly events: SalesEventPublisher) {}

  async execute(payload: { orderId: string }) {
    await this.events.orderShipped({
      orderId: payload.orderId,
    });

    return { shipped: true, orderId: payload.orderId };
  }
}
