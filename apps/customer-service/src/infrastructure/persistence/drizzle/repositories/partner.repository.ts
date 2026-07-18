import { and, asc, between, eq, exists, gte, ilike, isNull, lte, or, sql } from 'drizzle-orm';
import type { IPartnerRepository, PartnerListFilter } from '../../../../domain/repositories/partner.repository.interface'
import { PartnerEntity } from '../../../../domain/entities/partner.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { partnerCompanyProfiles, partnerContacts, partners } from '../schema'

export class DrizzlePartnerRepository implements IPartnerRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findById(id: string): Promise<PartnerEntity | null> {
    const rows = await this.db
      .select()
      .from(partners)
      .where(and(eq(partners.id, id), isNull(partners.deletedAt)))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByIdForUpdate(id: string): Promise<PartnerEntity | null> {
    const rows = await this.db
      .select()
      .from(partners)
      .where(and(eq(partners.id, id), isNull(partners.deletedAt)))
      .limit(1)
      .for('update');
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async save(partner: PartnerEntity): Promise<void> {
    await this.db.insert(partners).values({
      id: partner.id,
      companyId: partner.companyId,
      name: partner.name,
      type: partner.type,
      kind: partner.kind,
      status: partner.status,
      salesFunnelStage: partner.salesFunnelStage,
      assignedUserId: partner.assignedUserId,
      tags: partner.tags,
      mergedIntoId: partner.mergedIntoId,
      createdBy: partner.createdBy,
      createdAt: partner.createdAt,
    });
  }

  async update(partner: PartnerEntity): Promise<void> {
    await this.db.update(partners).set({
      name: partner.name,
      type: partner.type,
      status: partner.status,
      salesFunnelStage: partner.salesFunnelStage,
      assignedUserId: partner.assignedUserId,
      tags: partner.tags,
      mergedIntoId: partner.mergedIntoId,
      deletedAt: partner.deletedAt,
    }).where(eq(partners.id, partner.id));
  }

  async list(filter: PartnerListFilter): Promise<PartnerEntity[]> {
    const conditions = [
      eq(partners.companyId, filter.companyId),
      isNull(partners.deletedAt),
    ];
    if (filter.type) conditions.push(eq(partners.type, filter.type));
    if (filter.status) conditions.push(eq(partners.status, filter.status));
    if (filter.salesFunnelStage)
      conditions.push(eq(partners.salesFunnelStage, filter.salesFunnelStage));
    if (filter.assignedUserId)
      conditions.push(eq(partners.assignedUserId, filter.assignedUserId));
    if (filter.tag)
      conditions.push(sql`${filter.tag} = any(${partners.tags})`);
    if (filter.createdFrom && filter.createdTo)
      conditions.push(between(partners.createdAt, filter.createdFrom, filter.createdTo));
    else if (filter.createdFrom)
      conditions.push(gte(partners.createdAt, filter.createdFrom));
    else if (filter.createdTo)
      conditions.push(lte(partners.createdAt, filter.createdTo));

    // Global arama: partner adı, firma unvanı veya kişi e-posta/telefonu.
    if (filter.search) {
      const pattern = `%${filter.search}%`;
      const searchCondition = or(
        ilike(partners.name, pattern),
        exists(
          this.db
            .select({ id: partnerCompanyProfiles.id })
            .from(partnerCompanyProfiles)
            .where(
              and(
                eq(partnerCompanyProfiles.partnerId, partners.id),
                ilike(partnerCompanyProfiles.tradeName, pattern),
              ),
            ),
        ),
        exists(
          this.db
            .select({ id: partnerContacts.id })
            .from(partnerContacts)
            .where(
              and(
                eq(partnerContacts.partnerId, partners.id),
                or(
                  ilike(partnerContacts.email, pattern),
                  ilike(partnerContacts.phone, pattern),
                ),
              ),
            ),
        ),
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const rows = await this.db
      .select()
      .from(partners)
      .where(and(...conditions))
      .orderBy(asc(partners.name), asc(partners.id));
    return rows.map((row) => this.toEntity(row));
  }

  private toEntity(row: typeof partners.$inferSelect): PartnerEntity {
    return new PartnerEntity({
      id: row.id,
      companyId: row.companyId,
      name: row.name,
      type: row.type,
      kind: row.kind,
      status: row.status,
      salesFunnelStage: row.salesFunnelStage ?? null,
      assignedUserId: row.assignedUserId ?? null,
      tags: row.tags ?? [],
      mergedIntoId: row.mergedIntoId ?? null,
      createdBy: row.createdBy ?? null,
      createdAt: row.createdAt,
      deletedAt: row.deletedAt ?? null,
    });
  }
}
