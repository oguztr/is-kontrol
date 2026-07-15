export class GetStockCardQuery {
  constructor(
    public readonly productId: string,
    public readonly warehouseId?: string,
    public readonly dateFrom?: Date,
    public readonly dateTo?: Date,
  ) {}
}
