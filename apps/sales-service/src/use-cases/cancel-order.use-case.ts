import { Injectable } from '@nestjs/common';
import { SalesEventPublisher } from '../infrastructure/sales-event.publisher';

@Injectable()
export class CancelOrderUseCase {
  constructor(private readonly events: SalesEventPublisher) {}

  async execute(payload: { orderId: string; reason?: string }) {
    await this.events.orderCancelled({
      orderId: payload.orderId,
      reason: payload.reason,
    });

    return { cancelled: true, orderId: payload.orderId };
  }
}
