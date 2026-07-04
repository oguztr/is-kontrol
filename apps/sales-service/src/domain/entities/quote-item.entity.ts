export class QuoteItemEntity {
  constructor(
    public readonly id: string,
    public readonly quoteId: string,
    public readonly productId: string,
    public quantity: number,
    public unitPrice: number,
    public discount: number,
    public totalPrice: number
  ) {}
}
