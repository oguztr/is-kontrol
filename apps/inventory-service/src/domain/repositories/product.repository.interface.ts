import type { ProductEntity } from '../entities/product.entity'

export interface IProductRepository {
  findById(id: string): Promise<ProductEntity | null>;
  findBySku(companyId: string, sku: string): Promise<ProductEntity | null>;
  /** false, aynı company+SKU eşzamanlı olarak zaten oluşturuldu demektir. */
  save(product: ProductEntity): Promise<boolean>;
  update(product: ProductEntity): Promise<void>;
}
