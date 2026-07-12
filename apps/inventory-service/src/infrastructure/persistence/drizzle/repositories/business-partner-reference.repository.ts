import { eq, sql } from 'drizzle-orm';
import type {
  BusinessPartnerReference,
  IBusinessPartnerReferenceRepository,
} from '../../../../domain/repositories/business-partner-reference.repository.interface'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { businessPartnerReferences } from '../schema'

export class DrizzleBusinessPartnerReferenceRepository implements IBusinessPartnerReferenceRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findById(id: string): Promise<BusinessPartnerReference | null> {
    const rows = await this.db
      .select()
      .from(businessPartnerReferences)
      .where(eq(businessPartnerReferences.id, id))
      .limit(1);
    return rows[0]
      ? {
          id: rows[0].id,
          companyId: rows[0].companyId,
          name: rows[0].name,
          type: rows[0].type as BusinessPartnerReference['type'],
          isActive: rows[0].isActive,
          syncedAt: rows[0].syncedAt,
        }
      : null;
  }

  async upsert(reference: BusinessPartnerReference): Promise<void> {
    await this.db
      .insert(businessPartnerReferences)
      .values({
        id: reference.id,
        companyId: reference.companyId,
        name: reference.name,
        type: reference.type,
        isActive: reference.isActive,
        syncedAt: reference.syncedAt,
      })
      .onConflictDoUpdate({
        target: businessPartnerReferences.id,
        set: {
          name: reference.name,
          type: sql<string>`case
            when ${businessPartnerReferences.type} = 'BOTH' then 'BOTH'
            when ${businessPartnerReferences.type} <> ${reference.type} then 'BOTH'
            else ${reference.type}
          end`,
          isActive: reference.isActive,
          syncedAt: reference.syncedAt,
        },
      });
  }
}
