export class GetProductMovementHistoryQuery {
  constructor(
    public readonly productId: string,
    public readonly dateFrom?: Date,
    public readonly dateTo?: Date,
    public readonly limit?: number,
  ) {}
}
