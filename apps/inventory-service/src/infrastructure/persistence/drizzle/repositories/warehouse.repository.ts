import { eq, and, asc, isNull, sql } from 'drizzle-orm';
import type { IWarehouseRepository } from '../../../../domain/repositories/warehouse.repository.interface'
import { WarehouseEntity } from '../../../../domain/entities/warehouse.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { stockBalances, warehouses } from '../schema'

export class DrizzleWarehouseRepository implements IWarehouseRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findById(id: string): Promise<WarehouseEntity | null> {
    const rows = await this.db.select().from(warehouses).where(and(eq(warehouses.id, id), isNull(warehouses.deletedAt))).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByCode(companyId: string, code: string): Promise<WarehouseEntity | null> {
    const rows = await this.db
      .select()
      .from(warehouses)
      .where(and(eq(warehouses.companyId, companyId), eq(warehouses.code, code), isNull(warehouses.deletedAt)))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async list(companyId: string): Promise<WarehouseEntity[]> {
    const rows = await this.db.select().from(warehouses).where(and(
      eq(warehouses.companyId, companyId), isNull(warehouses.deletedAt),
    )).orderBy(asc(warehouses.code), asc(warehouses.id));
    return rows.map((row) => this.toEntity(row));
  }

  async save(warehouse: WarehouseEntity): Promise<boolean> {
    const rows = await this.db.insert(warehouses).values({
      id: warehouse.id,
      companyId: warehouse.companyId,
      code: warehouse.code,
      name: warehouse.name,
      address: warehouse.address ?? undefined,
      isActive: warehouse.isActive,
      createdAt: warehouse.createdAt,
    }).onConflictDoNothing({ target: [warehouses.companyId, warehouses.code] })
      .returning({ id: warehouses.id });
    return rows.length > 0;
  }

  async update(warehouse: WarehouseEntity): Promise<void> {
    await this.db.update(warehouses).set({
      name: warehouse.name, address: warehouse.address,
      isActive: warehouse.isActive, deletedAt: warehouse.deletedAt,
    }).where(eq(warehouses.id, warehouse.id));
  }

  async hasStock(warehouseId: string): Promise<boolean> {
    const rows = await this.db.select({ id: stockBalances.id }).from(stockBalances)
      .where(and(eq(stockBalances.warehouseId, warehouseId), sql`${stockBalances.quantity} <> 0`))
      .limit(1);
    return rows.length > 0;
  }

  private toEntity(row: typeof warehouses.$inferSelect): WarehouseEntity {
    return new WarehouseEntity({
      id: row.id,
      companyId: row.companyId,
      code: row.code,
      name: row.name,
      address: row.address ?? null,
      isActive: row.isActive,
      createdAt: row.createdAt,
      deletedAt: row.deletedAt ?? null,
    });
  }
}
