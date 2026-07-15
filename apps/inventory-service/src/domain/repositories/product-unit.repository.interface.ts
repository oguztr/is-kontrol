import type { ProductUnitEntity } from '../entities/product-unit.entity'

export interface IProductUnitRepository {
  findById(id: string): Promise<ProductUnitEntity | null>;
  findByProductAndUnit(productId: string, unitId: string): Promise<ProductUnitEntity | null>;
  listByProduct(productId: string): Promise<ProductUnitEntity[]>;
  /** Ürünün birim satırlarını transaction advisory lock ile serileştirir. */
  lockProductUnits(productId: string): Promise<void>;
  /** false, aynı product+unit satırı zaten oluşturuldu demektir. */
  save(productUnit: ProductUnitEntity): Promise<boolean>;
  update(productUnit: ProductUnitEntity): Promise<void>;
  delete(id: string): Promise<void>;
}
