export class AddProductUnitCommand {
  constructor(
    public readonly productId: string,
    public readonly unitId: string,
    public readonly conversionFactor: string,
    public readonly isPurchaseUnit: boolean,
    public readonly isSalesUnit: boolean,
    public readonly barcode: string | null = null,
  ) {}
}
