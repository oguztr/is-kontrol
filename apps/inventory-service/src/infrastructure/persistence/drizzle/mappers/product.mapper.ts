import { ProductEntity } from '../../../../domain/entities/product.entity'
import type { products } from '../schema'

type ProductRow = typeof products.$inferSelect;

export class ProductMapper {
  static toDomain(row: ProductRow): ProductEntity {
    return new ProductEntity({
      id: row.id,
      companyId: row.companyId,
      sku: row.sku,
      barcode: row.barcode,
      name: row.name,
      description: row.description ?? null,
      baseUnitId: row.baseUnitId,
      categoryId: row.categoryId ?? null,
      defaultCurrencyId: row.defaultCurrencyId ?? null,
      minStockLevel: row.minStockLevel ?? '0',
      maxStockLevel: row.maxStockLevel ?? null,
      isActive: row.isActive,
      createdAt: row.createdAt,
      archivedAt: row.archivedAt,
      deletedAt: row.deletedAt,
    });
  }

  static toPersistence(entity: ProductEntity): Omit<ProductRow, 'updatedAt'> {
    return {
      id: entity.id,
      companyId: entity.companyId,
      categoryId: entity.categoryId,
      sku: entity.sku,
      barcode: entity.barcode,
      name: entity.name,
      description: entity.description,
      baseUnitId: entity.baseUnitId,
      defaultCurrencyId: entity.defaultCurrencyId,
      minStockLevel: entity.minStockLevel,
      maxStockLevel: entity.maxStockLevel,
      isActive: entity.isActive,
      archivedAt: entity.archivedAt,
      deletedAt: entity.deletedAt,
      createdAt: entity.createdAt,
    };
  }
}
