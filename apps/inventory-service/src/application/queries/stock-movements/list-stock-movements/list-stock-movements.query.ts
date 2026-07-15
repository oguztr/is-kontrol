export class ListStockMovementsQuery {
  constructor(
    public readonly companyId: string,
    public readonly productId?: string,
    public readonly warehouseId?: string,
    /** Bağlı belgenin carisi üzerinden filtreler. */
    public readonly partnerId?: string,
    public readonly dateFrom?: Date,
    public readonly dateTo?: Date,
  ) {}
}
