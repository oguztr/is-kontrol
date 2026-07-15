export class GetStockBalanceQuery {
  constructor(
    public readonly warehouseId: string,
    public readonly productId: string,
  ) {}
}
