export class ProductUnitEntity {
  public conversionFactor: string;
  public isPurchaseUnit: boolean;
  public isSalesUnit: boolean;
  public barcode: string | null;

  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly unitId: string,
    conversionFactor: string,
    isPurchaseUnit: boolean,
    isSalesUnit: boolean,
    barcode: string | null,
    public readonly createdAt: Date,
  ) {
    this.conversionFactor = conversionFactor;
    this.isPurchaseUnit = isPurchaseUnit;
    this.isSalesUnit = isSalesUnit;
    this.barcode = barcode;
  }

  setConversionFactor(factor: string): void {
    this.conversionFactor = factor;
  }

  setPurchaseUnit(value: boolean): void {
    this.isPurchaseUnit = value;
  }

  setSalesUnit(value: boolean): void {
    this.isSalesUnit = value;
  }

  setBarcode(barcode: string | null): void {
    this.barcode = barcode;
  }
}
