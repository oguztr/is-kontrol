import type { ProductEntity } from '../entities/product.entity'

export interface ProductListFilter {
  companyId: string;
  categoryId?: string;
  isActive?: boolean;
  isArchived?: boolean;
  name?: string;
}

export interface IProductRepository {
  findById(id: string): Promise<ProductEntity | null>;
  findByIdForUpdate(id: string): Promise<ProductEntity | null>;
  findBySku(companyId: string, sku: string): Promise<ProductEntity | null>;
  findByBarcode(companyId: string, barcode: string): Promise<ProductEntity | null>;
  list(filter: ProductListFilter): Promise<ProductEntity[]>;
  lockCompanyProducts(companyId: string): Promise<void>;
  hasMovements(productId: string): Promise<boolean>;
  /** false, aynı company+SKU eşzamanlı olarak zaten oluşturuldu demektir. */
  save(product: ProductEntity): Promise<boolean>;
  update(product: ProductEntity): Promise<void>;
}
