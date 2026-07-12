import { eq, and, sql } from 'drizzle-orm';
import type { IStockBalanceRepository } from '../../../../domain/repositories/stock-balance.repository.interface'
import { StockBalanceEntity } from '../../../../domain/entities/stock-balance.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { stockBalances } from '../schema'

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

  async saveOrUpdate(balance: StockBalanceEntity): Promise<void> {
    await this.db
      .insert(stockBalances)
      .values({
        id: balance.id,
        companyId: balance.companyId,
        warehouseId: balance.warehouseId,
        productId: balance.productId,
        quantity: balance.quantity,
        averageCost: balance.averageCost,
        lastMovementId: balance.lastMovementId ?? undefined,
        updatedAt: balance.updatedAt,
      })
      .onConflictDoUpdate({
        target: [stockBalances.warehouseId, stockBalances.productId],
        set: {
          quantity: balance.quantity,
          averageCost: balance.averageCost,
          lastMovementId: balance.lastMovementId ?? undefined,
          updatedAt: balance.updatedAt,
        },
      });
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
      updatedAt: row.updatedAt,
    });
  }
}
