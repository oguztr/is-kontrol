import { and, eq, isNull } from 'drizzle-orm';
import type { ICompanyRepository } from '../../../../domain/repositories/company.repository.interface'
import { CompanyEntity } from '../../../../domain/entities/company.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { companies } from '../schema'

export class DrizzleCompanyRepository implements ICompanyRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findById(id: string): Promise<CompanyEntity | null> {
    const rows = await this.db
      .select()
      .from(companies)
      .where(and(eq(companies.id, id), isNull(companies.deletedAt)))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByIdForUpdate(id: string): Promise<CompanyEntity | null> {
    const rows = await this.db
      .select()
      .from(companies)
      .where(and(eq(companies.id, id), isNull(companies.deletedAt)))
      .limit(1)
      .for('update');
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async save(company: CompanyEntity): Promise<void> {
    await this.db.insert(companies).values({
      id: company.id,
      name: company.name,
      baseCurrencyCode: company.baseCurrencyCode,
      timezone: company.timezone,
      locale: company.locale,
      status: company.status,
      suspendedAt: company.suspendedAt,
      planTier: company.planTier,
      maxUsers: company.maxUsers,
      featureFlags: company.featureFlags,
      createdAt: company.createdAt,
    });
  }

  async update(company: CompanyEntity): Promise<void> {
    await this.db.update(companies).set({
      name: company.name,
      baseCurrencyCode: company.baseCurrencyCode,
      timezone: company.timezone,
      locale: company.locale,
      status: company.status,
      suspendedAt: company.suspendedAt,
      planTier: company.planTier,
      maxUsers: company.maxUsers,
      featureFlags: company.featureFlags,
      deletedAt: company.deletedAt,
    }).where(eq(companies.id, company.id));
  }

  private toEntity(row: typeof companies.$inferSelect): CompanyEntity {
    return new CompanyEntity({
      id: row.id,
      name: row.name,
      baseCurrencyCode: row.baseCurrencyCode,
      timezone: row.timezone,
      locale: row.locale,
      status: row.status,
      suspendedAt: row.suspendedAt ?? null,
      planTier: row.planTier,
      maxUsers: row.maxUsers ?? null,
      featureFlags: (row.featureFlags ?? {}) as Record<string, unknown>,
      createdAt: row.createdAt,
      deletedAt: row.deletedAt ?? null,
    });
  }
}
