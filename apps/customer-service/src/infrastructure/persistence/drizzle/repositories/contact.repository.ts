import { and, asc, desc, eq, isNotNull, or, sql } from 'drizzle-orm';
import type {
  ContactSearchFilter,
  EmailDuplicate,
  IContactRepository,
} from '../../../../domain/repositories/contact.repository.interface'
import { ContactEntity } from '../../../../domain/entities/contact.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { partnerContacts, partners } from '../schema'

export class DrizzleContactRepository implements IContactRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findById(id: string): Promise<ContactEntity | null> {
    const rows = await this.db
      .select()
      .from(partnerContacts)
      .where(eq(partnerContacts.id, id))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async listByPartner(partnerId: string): Promise<ContactEntity[]> {
    const rows = await this.db
      .select()
      .from(partnerContacts)
      .where(eq(partnerContacts.partnerId, partnerId))
      .orderBy(desc(partnerContacts.isPrimary), asc(partnerContacts.lastName), asc(partnerContacts.id));
    return rows.map((row) => this.toEntity(row));
  }

  async save(contact: ContactEntity): Promise<void> {
    await this.db.insert(partnerContacts).values({
      id: contact.id,
      partnerId: contact.partnerId,
      firstName: contact.firstName,
      lastName: contact.lastName,
      title: contact.title,
      department: contact.department,
      phone: contact.phone,
      email: contact.email,
      isPrimary: contact.isPrimary,
      createdAt: contact.createdAt,
    });
  }

  async update(contact: ContactEntity): Promise<void> {
    await this.db.update(partnerContacts).set({
      firstName: contact.firstName,
      lastName: contact.lastName,
      title: contact.title,
      department: contact.department,
      phone: contact.phone,
      email: contact.email,
      isPrimary: contact.isPrimary,
    }).where(eq(partnerContacts.id, contact.id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(partnerContacts).where(eq(partnerContacts.id, id));
  }

  async clearPrimary(partnerId: string): Promise<void> {
    await this.db.update(partnerContacts).set({ isPrimary: false }).where(and(
      eq(partnerContacts.partnerId, partnerId),
      eq(partnerContacts.isPrimary, true),
    ));
  }

  async search(filter: ContactSearchFilter): Promise<ContactEntity[]> {
    const criteria = [
      filter.phone ? eq(partnerContacts.phone, filter.phone) : undefined,
      filter.email ? eq(partnerContacts.email, filter.email) : undefined,
    ].filter((condition) => condition !== undefined);
    if (criteria.length === 0) return [];
    const rows = await this.db
      .select({ contact: partnerContacts })
      .from(partnerContacts)
      .innerJoin(partners, eq(partners.id, partnerContacts.partnerId))
      .where(and(
        eq(partners.companyId, filter.companyId),
        sql`${partners.deletedAt} is null`,
        or(...criteria),
      ))
      .orderBy(asc(partnerContacts.lastName), asc(partnerContacts.id));
    return rows.map((row) => this.toEntity(row.contact));
  }

  async reassignPartner(fromPartnerId: string, toPartnerId: string): Promise<void> {
    await this.db.update(partnerContacts).set({ partnerId: toPartnerId })
      .where(eq(partnerContacts.partnerId, fromPartnerId));
  }

  async listEmailDuplicates(companyId: string): Promise<EmailDuplicate[]> {
    const rows = await this.db
      .select({
        email: partnerContacts.email,
        partnerIds: sql<string[]>`array_agg(distinct ${partnerContacts.partnerId})`,
      })
      .from(partnerContacts)
      .innerJoin(partners, eq(partners.id, partnerContacts.partnerId))
      .where(sql`${partners.deletedAt} is null and ${isNotNull(partnerContacts.email)} and ${partners.companyId} = ${companyId}`)
      .groupBy(partnerContacts.email)
      .having(sql`count(distinct ${partnerContacts.partnerId}) > 1`);
    return rows
      .filter((row) => row.email !== null)
      .map((row) => ({ email: row.email as string, partnerIds: row.partnerIds }));
  }

  private toEntity(row: typeof partnerContacts.$inferSelect): ContactEntity {
    return new ContactEntity({
      id: row.id,
      partnerId: row.partnerId,
      firstName: row.firstName,
      lastName: row.lastName,
      title: row.title ?? null,
      department: row.department ?? null,
      phone: row.phone ?? null,
      email: row.email ?? null,
      isPrimary: row.isPrimary,
      createdAt: row.createdAt,
    });
  }
}
