import { and, desc, eq, isNull } from 'drizzle-orm';
import type { IInvitationRepository } from '../../../../domain/repositories/invitation.repository.interface'
import { InvitationEntity } from '../../../../domain/entities/invitation.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { invitations } from '../schema'

export class DrizzleInvitationRepository implements IInvitationRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findById(id: string): Promise<InvitationEntity | null> {
    const rows = await this.db
      .select()
      .from(invitations)
      .where(eq(invitations.id, id))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByTokenHash(tokenHash: string): Promise<InvitationEntity | null> {
    const rows = await this.db
      .select()
      .from(invitations)
      .where(eq(invitations.tokenHash, tokenHash))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findPendingByEmail(
    companyId: string,
    email: string,
  ): Promise<InvitationEntity | null> {
    const rows = await this.db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.companyId, companyId),
          eq(invitations.email, email.toLowerCase()),
          isNull(invitations.acceptedAt),
          isNull(invitations.revokedAt),
        ),
      )
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async save(invitation: InvitationEntity): Promise<void> {
    await this.db.insert(invitations).values({
      id: invitation.id,
      companyId: invitation.companyId,
      roleId: invitation.roleId,
      email: invitation.email,
      tokenHash: invitation.tokenHash,
      invitedByUserId: invitation.invitedByUserId,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    });
  }

  async update(invitation: InvitationEntity): Promise<void> {
    await this.db.update(invitations).set({
      acceptedAt: invitation.acceptedAt,
      revokedAt: invitation.revokedAt,
    }).where(eq(invitations.id, invitation.id));
  }

  async listPendingByCompany(companyId: string): Promise<InvitationEntity[]> {
    const rows = await this.db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.companyId, companyId),
          isNull(invitations.acceptedAt),
          isNull(invitations.revokedAt),
        ),
      )
      .orderBy(desc(invitations.createdAt));
    return rows.map((row) => this.toEntity(row));
  }

  private toEntity(row: typeof invitations.$inferSelect): InvitationEntity {
    return new InvitationEntity({
      id: row.id,
      companyId: row.companyId,
      roleId: row.roleId,
      email: row.email,
      tokenHash: row.tokenHash,
      invitedByUserId: row.invitedByUserId,
      expiresAt: row.expiresAt,
      acceptedAt: row.acceptedAt ?? null,
      revokedAt: row.revokedAt ?? null,
      createdAt: row.createdAt,
    });
  }
}
