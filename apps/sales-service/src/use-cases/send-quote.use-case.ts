import { Injectable } from '@nestjs/common';
import { SalesEventPublisher } from '../infrastructure/sales-event.publisher';

@Injectable()
export class SendQuoteUseCase {
  constructor(private readonly events: SalesEventPublisher) {}

  async execute(payload: { quoteId: string; customerId: string }) {
    await this.events.quoteSent({
      quoteId: payload.quoteId,
      customerId: payload.customerId,
    });

    return { sent: true, quoteId: payload.quoteId };
  }
}
