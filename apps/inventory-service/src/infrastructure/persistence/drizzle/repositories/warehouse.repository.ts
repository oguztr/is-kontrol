import { eq, and } from 'drizzle-orm';
import type { IWarehouseRepository } from '../../../../domain/repositories/warehouse.repository.interface'
import { WarehouseEntity } from '../../../../domain/entities/warehouse.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { warehouses } from '../schema'

export class DrizzleWarehouseRepository implements IWarehouseRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findById(id: string): Promise<WarehouseEntity | null> {
    const rows = await this.db.select().from(warehouses).where(eq(warehouses.id, id)).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByCode(companyId: string, code: string): Promise<WarehouseEntity | null> {
    const rows = await this.db
      .select()
      .from(warehouses)
      .where(and(eq(warehouses.companyId, companyId), eq(warehouses.code, code)))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async save(warehouse: WarehouseEntity): Promise<void> {
    await this.db.insert(warehouses).values({
      id: warehouse.id,
      companyId: warehouse.companyId,
      code: warehouse.code,
      name: warehouse.name,
      address: warehouse.address ?? undefined,
      isActive: warehouse.isActive,
      createdAt: warehouse.createdAt,
    });
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
    });
  }
}
