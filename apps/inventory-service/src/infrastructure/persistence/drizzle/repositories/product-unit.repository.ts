import { eq, and, asc, sql } from 'drizzle-orm';
import type { IProductUnitRepository } from '../../../../domain/repositories/product-unit.repository.interface'
import { ProductUnitEntity } from '../../../../domain/entities/product-unit.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { productUnits } from '../schema'

export class DrizzleProductUnitRepository implements IProductUnitRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findById(id: string): Promise<ProductUnitEntity | null> {
    const rows = await this.db.select().from(productUnits).where(eq(productUnits.id, id)).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByProductAndUnit(productId: string, unitId: string): Promise<ProductUnitEntity | null> {
    const rows = await this.db
      .select()
      .from(productUnits)
      .where(and(eq(productUnits.productId, productId), eq(productUnits.unitId, unitId)))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async listByProduct(productId: string): Promise<ProductUnitEntity[]> {
    const rows = await this.db
      .select()
      .from(productUnits)
      .where(eq(productUnits.productId, productId))
      .orderBy(asc(productUnits.createdAt));
    return rows.map((row) => this.toEntity(row));
  }

  async lockProductUnits(productId: string): Promise<void> {
    await this.db.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`product_units|${productId}`}, 0))`);
  }

  async save(productUnit: ProductUnitEntity): Promise<boolean> {
    const inserted = await this.db
      .insert(productUnits)
      .values({
        id: productUnit.id,
        productId: productUnit.productId,
        unitId: productUnit.unitId,
        conversionFactor: productUnit.conversionFactor,
        isPurchaseUnit: productUnit.isPurchaseUnit,
        isSalesUnit: productUnit.isSalesUnit,
        barcode: productUnit.barcode ?? undefined,
        createdAt: productUnit.createdAt,
      })
      .onConflictDoNothing({ target: [productUnits.productId, productUnits.unitId] })
      .returning({ id: productUnits.id });
    return inserted.length > 0;
  }

  async update(productUnit: ProductUnitEntity): Promise<void> {
    await this.db
      .update(productUnits)
      .set({
        conversionFactor: productUnit.conversionFactor,
        isPurchaseUnit: productUnit.isPurchaseUnit,
        isSalesUnit: productUnit.isSalesUnit,
        barcode: productUnit.barcode,
      })
      .where(eq(productUnits.id, productUnit.id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(productUnits).where(eq(productUnits.id, id));
  }

  private toEntity(row: typeof productUnits.$inferSelect): ProductUnitEntity {
    return new ProductUnitEntity(
      row.id,
      row.productId,
      row.unitId,
      row.conversionFactor,
      row.isPurchaseUnit,
      row.isSalesUnit,
      row.barcode ?? null,
      row.createdAt,
    );
  }
}
