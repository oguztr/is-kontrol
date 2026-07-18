import { and, eq, lte } from 'drizzle-orm';
import type {
  ProductReference,
  IProductReferenceRepository,
} from '../../../../domain/repositories/product-reference.repository.interface'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { productReferences } from '../schema'

export class DrizzleProductReferenceRepository implements IProductReferenceRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findById(id: string): Promise<ProductReference | null> {
    const rows = await this.db.select().from(productReferences).where(eq(productReferences.id, id)).limit(1);
    if (!rows[0]) return null;
    return {
      id: rows[0].id,
      companyId: rows[0].companyId,
      sku: rows[0].sku,
      barcode: rows[0].barcode,
      name: rows[0].name,
      isActive: rows[0].isActive,
      syncedAt: rows[0].syncedAt,
    };
  }

  async upsert(reference: ProductReference): Promise<void> {
    await this.db
      .insert(productReferences)
      .values({
        id: reference.id,
        companyId: reference.companyId,
        sku: reference.sku,
        barcode: reference.barcode,
        name: reference.name,
        isActive: reference.isActive,
        syncedAt: reference.syncedAt,
      })
      .onConflictDoUpdate({
        target: productReferences.id,
        set: {
          companyId: reference.companyId,
          sku: reference.sku,
          barcode: reference.barcode,
          name: reference.name,
          isActive: reference.isActive,
          syncedAt: reference.syncedAt,
        },
        setWhere: lte(productReferences.syncedAt, reference.syncedAt),
      });
  }

  async setActive(id: string, isActive: boolean, syncedAt: Date): Promise<void> {
    await this.db.update(productReferences).set({ isActive, syncedAt }).where(and(
      eq(productReferences.id, id), lte(productReferences.syncedAt, syncedAt),
    ));
  }
}
