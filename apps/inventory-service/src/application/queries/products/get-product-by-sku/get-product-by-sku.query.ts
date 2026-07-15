export class GetProductBySkuQuery {
  constructor(
    public readonly companyId: string,
    public readonly sku: string,
  ) {}
}
