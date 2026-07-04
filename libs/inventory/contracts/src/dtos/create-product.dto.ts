export type ProductUnit = 'piece' | 'kg' | 'liter' | 'box' | 'meter';

export interface CreateProductDto {
  name: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  unit: ProductUnit | string;
}
