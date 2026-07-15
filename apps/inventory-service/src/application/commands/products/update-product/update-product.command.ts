export class UpdateProductCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly description?: string | null,
    public readonly barcode?: string | null,
    public readonly categoryId?: string | null,
    public readonly defaultCurrencyId?: string | null,
    public readonly minStockLevel?: string,
    public readonly maxStockLevel?: string | null,
  ) {}
}
