import { Injectable } from '@nestjs/common';
import { SalesEventPublisher } from '../infrastructure/sales-event.publisher';

@Injectable()
export class ConvertQuoteToOrderUseCase {
  constructor(private readonly events: SalesEventPublisher) {}

  async execute(payload: { quoteId: string; customerId: string }) {
    const orderId = crypto.randomUUID();
    const orderNumber = `ORD-${Date.now()}`;

    await this.events.orderCreated({
      orderId,
      orderNumber,
      customerId: payload.customerId,
      quoteId: payload.quoteId,
    });

    return { orderId, orderNumber, quoteId: payload.quoteId };
  }
}
