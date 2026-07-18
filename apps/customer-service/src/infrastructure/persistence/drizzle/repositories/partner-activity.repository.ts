import { desc, eq } from 'drizzle-orm';
import type { IPartnerActivityRepository } from '../../../../domain/repositories/partner-activity.repository.interface'
import { PartnerActivityEntity } from '../../../../domain/entities/partner-activity.entity'
import type { PartnerActivityKind } from '../../../../domain/entities/partner-activity.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { partnerActivities } from '../schema'

export class DrizzlePartnerActivityRepository implements IPartnerActivityRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async save(activity: PartnerActivityEntity): Promise<void> {
    await this.db.insert(partnerActivities).values({
      id: activity.id,
      partnerId: activity.partnerId,
      kind: activity.kind,
      detail: activity.detail,
      actorUserId: activity.actorUserId,
      createdAt: activity.createdAt,
    });
  }

  async listByPartner(partnerId: string): Promise<PartnerActivityEntity[]> {
    const rows = await this.db
      .select()
      .from(partnerActivities)
      .where(eq(partnerActivities.partnerId, partnerId))
      .orderBy(desc(partnerActivities.createdAt), desc(partnerActivities.id));
    return rows.map((row) => new PartnerActivityEntity({
      id: row.id,
      partnerId: row.partnerId,
      kind: row.kind as PartnerActivityKind,
      detail: (row.detail ?? {}) as Record<string, unknown>,
      actorUserId: row.actorUserId ?? null,
      createdAt: row.createdAt,
    }));
  }

  async reassignPartner(fromPartnerId: string, toPartnerId: string): Promise<void> {
    await this.db.update(partnerActivities).set({ partnerId: toPartnerId })
      .where(eq(partnerActivities.partnerId, fromPartnerId));
  }
}
