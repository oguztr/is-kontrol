export type ProductUnit = 'piece' | 'kg' | 'liter' | 'box' | 'meter';

export interface CreateProductDto {
  name: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  unit: ProductUnit | string;
}

export interface ProductResponseDto {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  unit: string;
  stock: number;
}
