import { and, eq, isNull } from 'drizzle-orm';
import type { IRefreshTokenRepository } from '../../../../domain/repositories/refresh-token.repository.interface'
import { RefreshTokenEntity } from '../../../../domain/entities/refresh-token.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { refreshTokens } from '../schema'

export class DrizzleRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null> {
    const rows = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async save(token: RefreshTokenEntity): Promise<void> {
    await this.db.insert(refreshTokens).values({
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      familyId: token.familyId,
      expiresAt: token.expiresAt,
      userAgent: token.userAgent,
      ipAddress: token.ipAddress,
      createdAt: token.createdAt,
    });
  }

  async update(token: RefreshTokenEntity): Promise<void> {
    await this.db.update(refreshTokens).set({
      revokedAt: token.revokedAt,
      replacedByTokenId: token.replacedByTokenId,
    }).where(eq(refreshTokens.id, token.id));
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.familyId, familyId),
          isNull(refreshTokens.revokedAt),
        ),
      );
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)),
      );
  }

  private toEntity(row: typeof refreshTokens.$inferSelect): RefreshTokenEntity {
    return new RefreshTokenEntity({
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      familyId: row.familyId,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt ?? null,
      replacedByTokenId: row.replacedByTokenId ?? null,
      userAgent: row.userAgent ?? null,
      ipAddress: row.ipAddress ?? null,
      createdAt: row.createdAt,
    });
  }
}
