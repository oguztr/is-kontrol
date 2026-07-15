export class GetWarehouseMovementHistoryQuery {
  constructor(
    public readonly warehouseId: string,
    public readonly dateFrom?: Date,
    public readonly dateTo?: Date,
    public readonly limit?: number,
  ) {}
}
