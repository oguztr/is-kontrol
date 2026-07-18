import { and, eq, isNull } from 'drizzle-orm';
import type { IOneTimeTokenRepository } from '../../../../domain/repositories/one-time-token.repository.interface'
import type { OneTimeTokenPurpose } from '../../../../domain/entities/one-time-token.entity'
import { OneTimeTokenEntity } from '../../../../domain/entities/one-time-token.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { oneTimeTokens } from '../schema'

export class DrizzleOneTimeTokenRepository implements IOneTimeTokenRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findByTokenHash(tokenHash: string): Promise<OneTimeTokenEntity | null> {
    const rows = await this.db
      .select()
      .from(oneTimeTokens)
      .where(eq(oneTimeTokens.tokenHash, tokenHash))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async save(token: OneTimeTokenEntity): Promise<void> {
    await this.db.insert(oneTimeTokens).values({
      id: token.id,
      userId: token.userId,
      purpose: token.purpose,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
    });
  }

  async update(token: OneTimeTokenEntity): Promise<void> {
    await this.db.update(oneTimeTokens).set({
      usedAt: token.usedAt,
    }).where(eq(oneTimeTokens.id, token.id));
  }

  // "Geçersiz kılma" = kullanılmış işaretleme; ayrı bir durum alanı yerine
  // usedAt doldurulur, isUsable kontrolü ikisini de kapsar.
  async invalidateAllForUser(
    userId: string,
    purpose: OneTimeTokenPurpose,
  ): Promise<void> {
    await this.db
      .update(oneTimeTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(oneTimeTokens.userId, userId),
          eq(oneTimeTokens.purpose, purpose),
          isNull(oneTimeTokens.usedAt),
        ),
      );
  }

  private toEntity(row: typeof oneTimeTokens.$inferSelect): OneTimeTokenEntity {
    return new OneTimeTokenEntity({
      id: row.id,
      userId: row.userId,
      purpose: row.purpose,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt ?? null,
      createdAt: row.createdAt,
    });
  }
}
