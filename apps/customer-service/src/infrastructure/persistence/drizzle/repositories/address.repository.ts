import { and, asc, eq } from 'drizzle-orm';
import type { IAddressRepository } from '../../../../domain/repositories/address.repository.interface'
import { AddressEntity } from '../../../../domain/entities/address.entity'
import type { AddressType } from '../../../../domain/entities/address.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { partnerAddresses } from '../schema'

export class DrizzleAddressRepository implements IAddressRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findById(id: string): Promise<AddressEntity | null> {
    const rows = await this.db
      .select()
      .from(partnerAddresses)
      .where(eq(partnerAddresses.id, id))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async listByPartner(partnerId: string): Promise<AddressEntity[]> {
    const rows = await this.db
      .select()
      .from(partnerAddresses)
      .where(eq(partnerAddresses.partnerId, partnerId))
      .orderBy(asc(partnerAddresses.type), asc(partnerAddresses.id));
    return rows.map((row) => this.toEntity(row));
  }

  async save(address: AddressEntity): Promise<void> {
    await this.db.insert(partnerAddresses).values({
      id: address.id,
      partnerId: address.partnerId,
      type: address.type,
      label: address.label,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      district: address.district,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
      createdAt: address.createdAt,
    });
  }

  async update(address: AddressEntity): Promise<void> {
    await this.db.update(partnerAddresses).set({
      type: address.type,
      label: address.label,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      district: address.district,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    }).where(eq(partnerAddresses.id, address.id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(partnerAddresses).where(eq(partnerAddresses.id, id));
  }

  async clearDefault(partnerId: string, type: AddressType): Promise<void> {
    await this.db.update(partnerAddresses).set({ isDefault: false }).where(and(
      eq(partnerAddresses.partnerId, partnerId),
      eq(partnerAddresses.type, type),
      eq(partnerAddresses.isDefault, true),
    ));
  }

  async clearAllDefaults(partnerId: string): Promise<void> {
    await this.db.update(partnerAddresses).set({ isDefault: false }).where(and(
      eq(partnerAddresses.partnerId, partnerId),
      eq(partnerAddresses.isDefault, true),
    ));
  }

  async reassignPartner(fromPartnerId: string, toPartnerId: string): Promise<void> {
    await this.db.update(partnerAddresses).set({ partnerId: toPartnerId })
      .where(eq(partnerAddresses.partnerId, fromPartnerId));
  }

  private toEntity(row: typeof partnerAddresses.$inferSelect): AddressEntity {
    return new AddressEntity({
      id: row.id,
      partnerId: row.partnerId,
      type: row.type,
      label: row.label ?? null,
      line1: row.line1,
      line2: row.line2 ?? null,
      city: row.city,
      district: row.district ?? null,
      postalCode: row.postalCode ?? null,
      country: row.country,
      isDefault: row.isDefault,
      createdAt: row.createdAt,
    });
  }
}
