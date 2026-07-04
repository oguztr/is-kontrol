import { Injectable } from '@nestjs/common';
import { SalesEventPublisher } from '../infrastructure/sales-event.publisher';

@Injectable()
export class CompleteOrderUseCase {
  constructor(private readonly events: SalesEventPublisher) {}

  async execute(payload: { orderId: string }) {
    await this.events.orderCompleted({
      orderId: payload.orderId,
    });

    return { completed: true, orderId: payload.orderId };
  }
}
