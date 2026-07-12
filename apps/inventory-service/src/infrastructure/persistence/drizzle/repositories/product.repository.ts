import { eq, and } from 'drizzle-orm';
import type { IProductRepository } from '../../../../domain/repositories/product.repository.interface'
import { ProductEntity } from '../../../../domain/entities/product.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { products } from '../schema'

export class DrizzleProductRepository implements IProductRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findById(id: string): Promise<ProductEntity | null> {
    const rows = await this.db.select().from(products).where(eq(products.id, id)).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findBySku(companyId: string, sku: string): Promise<ProductEntity | null> {
    const rows = await this.db
      .select()
      .from(products)
      .where(and(eq(products.companyId, companyId), eq(products.sku, sku)))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async save(product: ProductEntity): Promise<boolean> {
    const inserted = await this.db
      .insert(products)
      .values({
        id: product.id,
        companyId: product.companyId,
        sku: product.sku,
        name: product.name,
        description: product.description,
        baseUnitId: product.baseUnitId,
        categoryId: product.categoryId,
        defaultCurrencyId: product.defaultCurrencyId,
        minStockLevel: product.minStockLevel,
        maxStockLevel: product.maxStockLevel ?? undefined,
        isActive: product.isActive,
        createdAt: product.createdAt,
      })
      .onConflictDoNothing({
        target: [products.companyId, products.sku],
      })
      .returning({ id: products.id });
    return inserted.length > 0;
  }

  async update(product: ProductEntity): Promise<void> {
    await this.db
      .update(products)
      .set({
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        defaultCurrencyId: product.defaultCurrencyId,
        minStockLevel: product.minStockLevel,
        maxStockLevel: product.maxStockLevel ?? undefined,
        isActive: product.isActive,
      })
      .where(eq(products.id, product.id));
  }

  private toEntity(row: typeof products.$inferSelect): ProductEntity {
    return new ProductEntity({
      id: row.id,
      companyId: row.companyId,
      sku: row.sku,
      name: row.name,
      description: row.description ?? null,
      baseUnitId: row.baseUnitId,
      categoryId: row.categoryId ?? null,
      defaultCurrencyId: row.defaultCurrencyId ?? null,
      minStockLevel: row.minStockLevel ?? '0',
      maxStockLevel: row.maxStockLevel ?? null,
      isActive: row.isActive,
      createdAt: row.createdAt,
    });
  }
}
