export class GetProductByBarcodeQuery {
  constructor(
    public readonly companyId: string,
    public readonly barcode: string,
  ) {}
}
