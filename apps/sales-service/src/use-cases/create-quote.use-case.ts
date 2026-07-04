import { Injectable } from '@nestjs/common';
import type { CreateQuoteDto, QuoteResponseDto } from '@is-kontrol/sales-contracts';
import { QuoteEntity } from '../domain/entities/quote.entity';
import { QuoteItemEntity } from '../domain/entities/quote-item.entity';
import { SalesEventPublisher } from '../infrastructure/sales-event.publisher';

@Injectable()
export class CreateQuoteUseCase {
  constructor(private readonly events: SalesEventPublisher) {}

  async execute(dto: CreateQuoteDto): Promise<QuoteResponseDto> {
    const now = new Date();
    const quoteId = crypto.randomUUID();
    const quoteNumber = `QT-${Date.now()}`;

    const items = dto.items.map(item =>
      new QuoteItemEntity(
        crypto.randomUUID(),
        quoteId,
        item.productId,
        item.quantity,
        item.unitPrice,
        item.discount ?? 0,
        item.quantity * item.unitPrice - (item.discount ?? 0)
      )
    );

    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const discountTotal = items.reduce((sum, i) => sum + i.discount, 0);
    const taxTotal = subtotal * 0.2;
    const grandTotal = subtotal - discountTotal + taxTotal;

    const quote = new QuoteEntity(
      quoteId,
      quoteNumber,
      dto.customerId,
      'DRAFT',
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      new Date(dto.validUntil),
      now
    );

    await this.events.quoteCreated({
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      customerId: quote.customerId,
    });

    return {
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      items: items.map(i => ({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        totalPrice: i.totalPrice,
      })),
      totals: {
        subtotal,
        discount: discountTotal,
        tax: taxTotal,
        grandTotal,
      },
    };
  }
}
