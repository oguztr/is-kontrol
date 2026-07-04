import { Injectable } from '@nestjs/common';
import { SalesEventPublisher } from '../infrastructure/sales-event.publisher';

@Injectable()
export class RejectQuoteUseCase {
  constructor(private readonly events: SalesEventPublisher) {}

  async execute(payload: { quoteId: string; reason?: string }) {
    await this.events.quoteRejected({
      quoteId: payload.quoteId,
      reason: payload.reason,
    });

    return { rejected: true, quoteId: payload.quoteId };
  }
}
