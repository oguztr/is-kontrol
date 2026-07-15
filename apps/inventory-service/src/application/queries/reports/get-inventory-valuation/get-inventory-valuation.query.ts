export class GetInventoryValuationQuery {
  constructor(
    public readonly companyId: string,
    public readonly warehouseId?: string,
  ) {}
}
