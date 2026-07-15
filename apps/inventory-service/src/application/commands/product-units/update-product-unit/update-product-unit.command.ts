export class UpdateProductUnitCommand {
  constructor(
    public readonly id: string,
    public readonly conversionFactor?: string,
    public readonly isPurchaseUnit?: boolean,
    public readonly isSalesUnit?: boolean,
    public readonly barcode?: string | null,
  ) {}
}
