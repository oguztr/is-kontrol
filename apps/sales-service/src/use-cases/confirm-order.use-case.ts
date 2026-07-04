import { Injectable } from '@nestjs/common';
import { SalesEventPublisher } from '../infrastructure/sales-event.publisher';

@Injectable()
export class ConfirmOrderUseCase {
  constructor(private readonly events: SalesEventPublisher) {}

  async execute(payload: { orderId: string }) {
    await this.events.orderConfirmed({
      orderId: payload.orderId,
    });

    return { confirmed: true, orderId: payload.orderId };
  }
}
