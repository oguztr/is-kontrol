export type ProductUnit = 'piece' | 'kg' | 'liter' | 'box' | 'meter';

export class ProductEntity {
  constructor(
    public readonly id: string,
    public name: string,
    public readonly sku: string,
    public barcode: string | null,
    public categoryId: string,
    public unit: ProductUnit,
    public isActive: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {}
}
