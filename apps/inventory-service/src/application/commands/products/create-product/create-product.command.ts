export class CreateProductCommand {
  constructor(
    public readonly companyId: string,
    public readonly sku: string,
    public readonly name: string,
    public readonly baseUnitId: string,
    public readonly description: string | null = null,
    public readonly categoryId: string | null = null,
    public readonly defaultCurrencyId: string | null = null,
    public readonly minStockLevel = "0",
    public readonly maxStockLevel: string | null = null,
  ) {}
}
