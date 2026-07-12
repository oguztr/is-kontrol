import { and, asc, eq, ilike, isNotNull, isNull, sql } from 'drizzle-orm';
import type { IProductRepository, ProductListFilter } from '../../../../domain/repositories/product.repository.interface'
import { ProductEntity } from '../../../../domain/entities/product.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { products, stockMovements } from '../schema'

export class DrizzleProductRepository implements IProductRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findById(id: string): Promise<ProductEntity | null> {
    const rows = await this.db.select().from(products).where(and(eq(products.id, id), isNull(products.deletedAt))).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByIdForUpdate(id: string): Promise<ProductEntity | null> {
    const rows = await this.db.select().from(products)
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .limit(1).for('update');
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findBySku(companyId: string, sku: string): Promise<ProductEntity | null> {
    const rows = await this.db
      .select()
      .from(products)
      .where(and(eq(products.companyId, companyId), eq(products.sku, sku), isNull(products.deletedAt)))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByBarcode(companyId: string, barcode: string): Promise<ProductEntity | null> {
    const rows = await this.db.select().from(products).where(and(
      eq(products.companyId, companyId), eq(products.barcode, barcode), isNull(products.deletedAt),
    )).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async list(filter: ProductListFilter): Promise<ProductEntity[]> {
    const conditions = [eq(products.companyId, filter.companyId), isNull(products.deletedAt)];
    if (filter.categoryId) conditions.push(eq(products.categoryId, filter.categoryId));
    if (filter.isActive !== undefined) conditions.push(eq(products.isActive, filter.isActive));
    conditions.push(filter.isArchived ? isNotNull(products.archivedAt) : isNull(products.archivedAt));
    if (filter.name) conditions.push(ilike(products.name, `%${filter.name}%`));
    const rows = await this.db.select().from(products).where(and(...conditions))
      .orderBy(asc(products.name), asc(products.id));
    return rows.map((row) => this.toEntity(row));
  }

  async lockCompanyProducts(companyId: string): Promise<void> {
    await this.db.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`products|${companyId}`}, 0))`);
  }

  async hasMovements(productId: string): Promise<boolean> {
    const rows = await this.db.select({ id: stockMovements.id }).from(stockMovements)
      .where(eq(stockMovements.productId, productId)).limit(1);
    return rows.length > 0;
  }

  async save(product: ProductEntity): Promise<boolean> {
    const inserted = await this.db
      .insert(products)
      .values({
        id: product.id,
        companyId: product.companyId,
        sku: product.sku,
        name: product.name,
        barcode: product.barcode,
        description: product.description,
        baseUnitId: product.baseUnitId,
        categoryId: product.categoryId,
        defaultCurrencyId: product.defaultCurrencyId,
        minStockLevel: product.minStockLevel,
        maxStockLevel: product.maxStockLevel,
        isActive: product.isActive,
        archivedAt: product.archivedAt,
        deletedAt: product.deletedAt,
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
        barcode: product.barcode,
        description: product.description,
        baseUnitId: product.baseUnitId,
        categoryId: product.categoryId,
        defaultCurrencyId: product.defaultCurrencyId,
        minStockLevel: product.minStockLevel,
        maxStockLevel: product.maxStockLevel,
        isActive: product.isActive,
        archivedAt: product.archivedAt,
        deletedAt: product.deletedAt,
      })
      .where(eq(products.id, product.id));
  }

  private toEntity(row: typeof products.$inferSelect): ProductEntity {
    return new ProductEntity({
      id: row.id,
      companyId: row.companyId,
      sku: row.sku,
      barcode: row.barcode ?? null,
      name: row.name,
      description: row.description ?? null,
      baseUnitId: row.baseUnitId,
      categoryId: row.categoryId ?? null,
      defaultCurrencyId: row.defaultCurrencyId ?? null,
      minStockLevel: row.minStockLevel ?? '0',
      maxStockLevel: row.maxStockLevel ?? null,
      isActive: row.isActive,
      createdAt: row.createdAt,
      archivedAt: row.archivedAt ?? null,
      deletedAt: row.deletedAt ?? null,
    });
  }
}
