import { eq, isNotNull, sql } from 'drizzle-orm';
import type {
  ICompanyProfileRepository,
  TaxNumberDuplicate,
} from '../../../../domain/repositories/company-profile.repository.interface'
import { CompanyProfileEntity } from '../../../../domain/entities/company-profile.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { partnerCompanyProfiles, partners } from '../schema'

export class DrizzleCompanyProfileRepository implements ICompanyProfileRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findByPartnerId(partnerId: string): Promise<CompanyProfileEntity | null> {
    const rows = await this.db
      .select()
      .from(partnerCompanyProfiles)
      .where(eq(partnerCompanyProfiles.partnerId, partnerId))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async save(profile: CompanyProfileEntity): Promise<void> {
    await this.db.insert(partnerCompanyProfiles).values({
      id: profile.id,
      partnerId: profile.partnerId,
      tradeName: profile.tradeName,
      taxNumber: profile.taxNumber,
      taxOffice: profile.taxOffice,
      industry: profile.industry,
      website: profile.website,
      parentPartnerId: profile.parentPartnerId,
      paymentTermDays: profile.paymentTermDays,
      preferredCurrencyCode: profile.preferredCurrencyCode,
      createdAt: profile.createdAt,
    });
  }

  async update(profile: CompanyProfileEntity): Promise<void> {
    await this.db.update(partnerCompanyProfiles).set({
      tradeName: profile.tradeName,
      taxNumber: profile.taxNumber,
      taxOffice: profile.taxOffice,
      industry: profile.industry,
      website: profile.website,
      parentPartnerId: profile.parentPartnerId,
      paymentTermDays: profile.paymentTermDays,
      preferredCurrencyCode: profile.preferredCurrencyCode,
    }).where(eq(partnerCompanyProfiles.id, profile.id));
  }

  async moveToPartner(profileId: string, partnerId: string): Promise<void> {
    await this.db.update(partnerCompanyProfiles).set({ partnerId })
      .where(eq(partnerCompanyProfiles.id, profileId));
  }

  async deleteByPartnerId(partnerId: string): Promise<void> {
    await this.db.delete(partnerCompanyProfiles)
      .where(eq(partnerCompanyProfiles.partnerId, partnerId));
  }

  async listTaxNumberDuplicates(companyId: string): Promise<TaxNumberDuplicate[]> {
    const rows = await this.db
      .select({
        taxNumber: partnerCompanyProfiles.taxNumber,
        partnerIds: sql<string[]>`array_agg(${partnerCompanyProfiles.partnerId})`,
      })
      .from(partnerCompanyProfiles)
      .innerJoin(partners, eq(partners.id, partnerCompanyProfiles.partnerId))
      .where(sql`${partners.deletedAt} is null and ${isNotNull(partnerCompanyProfiles.taxNumber)} and ${partners.companyId} = ${companyId}`)
      .groupBy(partnerCompanyProfiles.taxNumber)
      .having(sql`count(*) > 1`);
    return rows
      .filter((row) => row.taxNumber !== null)
      .map((row) => ({ taxNumber: row.taxNumber as string, partnerIds: row.partnerIds }));
  }

  private toEntity(
    row: typeof partnerCompanyProfiles.$inferSelect,
  ): CompanyProfileEntity {
    return new CompanyProfileEntity({
      id: row.id,
      partnerId: row.partnerId,
      tradeName: row.tradeName,
      taxNumber: row.taxNumber ?? null,
      taxOffice: row.taxOffice ?? null,
      industry: row.industry ?? null,
      website: row.website ?? null,
      parentPartnerId: row.parentPartnerId ?? null,
      paymentTermDays: row.paymentTermDays ?? null,
      preferredCurrencyCode: row.preferredCurrencyCode ?? null,
      createdAt: row.createdAt,
    });
  }
}
