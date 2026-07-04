import { Injectable } from '@nestjs/common';
import { SalesEventPublisher } from '../infrastructure/sales-event.publisher';

@Injectable()
export class AcceptQuoteUseCase {
  constructor(private readonly events: SalesEventPublisher) {}

  async execute(payload: { quoteId: string; customerId: string }) {
    await this.events.quoteAccepted({
      quoteId: payload.quoteId,
      customerId: payload.customerId,
    });

    return { accepted: true, quoteId: payload.quoteId };
  }
}
