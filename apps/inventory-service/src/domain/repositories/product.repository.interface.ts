import type { ProductEntity } from '../entities/product.entity'

export interface IProductRepository {
  findById(id: string): Promise<ProductEntity | null>;
  findBySku(companyId: string, sku: string): Promise<ProductEntity | null>;
  save(product: ProductEntity): Promise<void>;
  update(product: ProductEntity): Promise<void>;
}
