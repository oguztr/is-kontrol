export class StockItemEntity {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly warehouseId: string,
    public availableQuantity: number,
    public reservedQuantity: number
  ) {}

  get totalQuantity(): number {
    return this.availableQuantity + this.reservedQuantity;
  }
}
