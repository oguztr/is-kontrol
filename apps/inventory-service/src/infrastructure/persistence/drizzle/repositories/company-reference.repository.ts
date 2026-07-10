import { eq } from 'drizzle-orm';
import type {
  CompanyReference,
  ICompanyReferenceRepository,
} from '../../../../domain/repositories/company-reference.repository.interface'
import type { WriteDb } from '../drizzle.provider'
import { companyReferences } from '../schema'

export class DrizzleCompanyReferenceRepository implements ICompanyReferenceRepository {
  constructor(private readonly db: WriteDb) {}

  async findById(id: string): Promise<CompanyReference | null> {
    const rows = await this.db.select().from(companyReferences).where(eq(companyReferences.id, id)).limit(1);
    if (!rows[0]) return null;
    return {
      id: rows[0].id,
      name: rows[0].name,
      baseCurrencyCode: rows[0].baseCurrencyCode,
      isActive: rows[0].isActive,
      syncedAt: rows[0].syncedAt,
    };
  }

  async upsert(reference: CompanyReference): Promise<void> {
    await this.db
      .insert(companyReferences)
      .values({
        id: reference.id,
        name: reference.name,
        baseCurrencyCode: reference.baseCurrencyCode,
        isActive: reference.isActive,
        syncedAt: reference.syncedAt,
      })
      .onConflictDoUpdate({
        target: companyReferences.id,
        set: {
          name: reference.name,
          baseCurrencyCode: reference.baseCurrencyCode,
          isActive: reference.isActive,
          syncedAt: reference.syncedAt,
        },
      });
  }
}
