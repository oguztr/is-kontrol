import { eq, and, sql, asc, lt, lte, gt, isNull, isNotNull } from 'drizzle-orm';
import type {
  IStockBalanceRepository, StockLevelBreach, OutOfStockProduct,
  CompanyStockTotals, ProductValuationRow,
} from '../../../../domain/repositories/stock-balance.repository.interface'
import { StockBalanceEntity } from '../../../../domain/entities/stock-balance.entity'
import { OptimisticLockError } from '../../../../domain/errors/optimistic-lock.error'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { products, stockBalances } from '../schema'

export class DrizzleStockBalanceRepository implements IStockBalanceRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findByWarehouseAndProduct(
    warehouseId: string,
    productId: string,
  ): Promise<StockBalanceEntity | null> {
    const rows = await this.db
      .select()
      .from(stockBalances)
      .where(and(eq(stockBalances.warehouseId, warehouseId), eq(stockBalances.productId, productId)))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async listByWarehouse(warehouseId: string): Promise<StockBalanceEntity[]> {
    const rows = await this.db
      .select()
      .from(stockBalances)
      .where(eq(stockBalances.warehouseId, warehouseId))
      .orderBy(asc(stockBalances.productId));
    return rows.map((row) => this.toEntity(row));
  }

  async listByProduct(productId: string): Promise<StockBalanceEntity[]> {
    const rows = await this.db
      .select()
      .from(stockBalances)
      .where(eq(stockBalances.productId, productId))
      .orderBy(asc(stockBalances.warehouseId));
    return rows.map((row) => this.toEntity(row));
  }

  async listBelowMinimum(companyId: string): Promise<StockLevelBreach[]> {
    const rows = await this.db
      .select({
        productId: stockBalances.productId,
        warehouseId: stockBalances.warehouseId,
        quantity: stockBalances.quantity,
        threshold: products.minStockLevel,
      })
      .from(stockBalances)
      .innerJoin(products, eq(stockBalances.productId, products.id))
      .where(and(
        eq(stockBalances.companyId, companyId),
        isNull(products.deletedAt),
        gt(products.minStockLevel, '0'),
        lte(stockBalances.quantity, products.minStockLevel),
      ));
    return rows.map((row) => ({ ...row, threshold: row.threshold ?? '0' }));
  }

  async listAboveMaximum(companyId: string): Promise<StockLevelBreach[]> {
    const rows = await this.db
      .select({
        productId: stockBalances.productId,
        warehouseId: stockBalances.warehouseId,
        quantity: stockBalances.quantity,
        threshold: products.maxStockLevel,
      })
      .from(stockBalances)
      .innerJoin(products, eq(stockBalances.productId, products.id))
      .where(and(
        eq(stockBalances.companyId, companyId),
        isNull(products.deletedAt),
        isNotNull(products.maxStockLevel),
        gt(stockBalances.quantity, products.maxStockLevel),
      ));
    return rows.map((row) => ({ ...row, threshold: row.threshold ?? '0' }));
  }

  async listOutOfStockProducts(companyId: string): Promise<OutOfStockProduct[]> {
    return this.db
      .select({
        productId: products.id,
        sku: products.sku,
        name: products.name,
      })
      .from(products)
      .leftJoin(stockBalances, eq(stockBalances.productId, products.id))
      .where(and(eq(products.companyId, companyId), isNull(products.deletedAt)))
      .groupBy(products.id, products.sku, products.name)
      .having(sql`coalesce(sum(${stockBalances.quantity}), 0) <= 0`);
  }

  async listNegative(companyId: string): Promise<StockBalanceEntity[]> {
    const rows = await this.db
      .select()
      .from(stockBalances)
      .where(and(eq(stockBalances.companyId, companyId), lt(stockBalances.quantity, '0')));
    return rows.map((row) => this.toEntity(row));
  }

  async companySummary(companyId: string): Promise<CompanyStockTotals> {
    const rows = await this.db
      .select({
        productCount: sql<number>`count(distinct ${stockBalances.productId})::int`,
        totalQuantity: sql<string>`coalesce(sum(${stockBalances.quantity}), 0)::numeric(18,4)::text`,
        totalValue: sql<string>`coalesce(sum(${stockBalances.quantity} * ${stockBalances.averageCost}), 0)::numeric(18,4)::text`,
      })
      .from(stockBalances)
      .innerJoin(products, eq(stockBalances.productId, products.id))
      .where(and(eq(stockBalances.companyId, companyId), isNull(products.deletedAt)));
    return rows[0] ?? { productCount: 0, totalQuantity: '0.0000', totalValue: '0.0000' };
  }

  async valuation(companyId: string, warehouseId?: string): Promise<ProductValuationRow[]> {
    const conditions = [eq(stockBalances.companyId, companyId), isNull(products.deletedAt)];
    if (warehouseId) conditions.push(eq(stockBalances.warehouseId, warehouseId));
    return this.db
      .select({
        productId: products.id,
        sku: products.sku,
        name: products.name,
        totalQuantity: sql<string>`sum(${stockBalances.quantity})::numeric(18,4)::text`,
        averageCost: sql<string>`case when sum(${stockBalances.quantity}) = 0 then '0.0000'
          else (sum(${stockBalances.quantity} * ${stockBalances.averageCost}) / sum(${stockBalances.quantity}))::numeric(18,4)::text end`,
        totalValue: sql<string>`sum(${stockBalances.quantity} * ${stockBalances.averageCost})::numeric(18,4)::text`,
      })
      .from(stockBalances)
      .innerJoin(products, eq(stockBalances.productId, products.id))
      .where(and(...conditions))
      .groupBy(products.id, products.sku, products.name)
      .orderBy(asc(products.name), asc(products.id));
  }

  async lockWarehouseAndProduct(
    warehouseId: string,
    productId: string,
  ): Promise<void> {
    const lockKey = `${warehouseId}|${productId}`;
    await this.db.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`,
    );
  }

  async findByWarehouseAndProductForUpdate(
    warehouseId: string,
    productId: string,
  ): Promise<StockBalanceEntity | null> {
    const rows = await this.db
      .select()
      .from(stockBalances)
      .where(and(eq(stockBalances.warehouseId, warehouseId), eq(stockBalances.productId, productId)))
      .limit(1)
      .for('update');
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  /* Optimistic locking: güncelleme yalnızca satır hâlâ entity'nin okuduğu
   * sürümdeyse uygulanır ve sürümü bir artırır. Sürüm kaymışsa (pessimistic
   * kilitleri atlayan bir yol yarışı kaybetmişse) OptimisticLockError fırlar;
   * unit-of-work transaction'ı baştan dener. */
  async saveOrUpdate(balance: StockBalanceEntity): Promise<void> {
    const written = await this.db
      .insert(stockBalances)
      .values({
        id: balance.id,
        companyId: balance.companyId,
        warehouseId: balance.warehouseId,
        productId: balance.productId,
        quantity: balance.quantity,
        averageCost: balance.averageCost,
        lastMovementId: balance.lastMovementId ?? undefined,
        version: balance.version + 1,
        updatedAt: balance.updatedAt,
      })
      .onConflictDoUpdate({
        target: [stockBalances.warehouseId, stockBalances.productId],
        set: {
          quantity: balance.quantity,
          averageCost: balance.averageCost,
          lastMovementId: balance.lastMovementId ?? undefined,
          version: sql`${stockBalances.version} + 1`,
          updatedAt: balance.updatedAt,
        },
        setWhere: eq(stockBalances.version, balance.version),
      })
      .returning({ id: stockBalances.id });
    if (written.length === 0) {
      throw new OptimisticLockError(balance.warehouseId, balance.productId);
    }
  }

  private toEntity(row: typeof stockBalances.$inferSelect): StockBalanceEntity {
    return new StockBalanceEntity({
      id: row.id,
      companyId: row.companyId,
      warehouseId: row.warehouseId,
      productId: row.productId,
      quantity: row.quantity,
      averageCost: row.averageCost,
      lastMovementId: row.lastMovementId ?? null,
      version: row.version,
      updatedAt: row.updatedAt,
    });
  }
}
