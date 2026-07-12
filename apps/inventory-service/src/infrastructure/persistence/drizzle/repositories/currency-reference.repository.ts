import { and, eq, lte } from 'drizzle-orm';
import type {
  CurrencyReference,
  ICurrencyReferenceRepository,
} from '../../../../domain/repositories/currency-reference.repository.interface'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { currencyReferences } from '../schema'

export class DrizzleCurrencyReferenceRepository implements ICurrencyReferenceRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findById(id: string): Promise<CurrencyReference | null> {
    const rows = await this.db.select().from(currencyReferences).where(eq(currencyReferences.id, id)).limit(1);
    return rows[0] ? this.toDto(rows[0]) : null;
  }

  async findByCode(code: string): Promise<CurrencyReference | null> {
    const rows = await this.db.select().from(currencyReferences).where(eq(currencyReferences.code, code)).limit(1);
    return rows[0] ? this.toDto(rows[0]) : null;
  }

  async upsert(reference: CurrencyReference): Promise<void> {
    await this.db
      .insert(currencyReferences)
      .values({
        id: reference.id,
        code: reference.code,
        name: reference.name,
        decimalPlaces: reference.decimalPlaces,
        isActive: reference.isActive,
        syncedAt: reference.syncedAt,
      })
      .onConflictDoUpdate({
        target: currencyReferences.id,
        set: {
          code: reference.code,
          name: reference.name,
          decimalPlaces: reference.decimalPlaces,
          isActive: reference.isActive,
          syncedAt: reference.syncedAt,
        },
        setWhere: lte(currencyReferences.syncedAt, reference.syncedAt),
      });
  }

  async setActive(id: string, isActive: boolean, syncedAt: Date): Promise<void> {
    await this.db.update(currencyReferences).set({ isActive, syncedAt }).where(and(
      eq(currencyReferences.id, id), lte(currencyReferences.syncedAt, syncedAt),
    ));
  }

  private toDto(row: typeof currencyReferences.$inferSelect): CurrencyReference {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      decimalPlaces: row.decimalPlaces,
      isActive: row.isActive,
      syncedAt: row.syncedAt,
    };
  }
}
