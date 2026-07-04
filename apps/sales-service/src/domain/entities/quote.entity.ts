export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export class QuoteEntity {
  constructor(
    public readonly id: string,
    public readonly quoteNumber: string,
    public readonly customerId: string,
    public status: QuoteStatus,
    public subtotal: number,
    public discountTotal: number,
    public taxTotal: number,
    public grandTotal: number,
    public validUntil: Date,
    public readonly createdAt: Date
  ) {}
}
