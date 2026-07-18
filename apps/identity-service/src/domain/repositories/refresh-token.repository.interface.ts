import type { RefreshTokenEntity } from "../entities/refresh-token.entity";

export interface IRefreshTokenRepository {
  findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null>;
  save(token: RefreshTokenEntity): Promise<void>;
  update(token: RefreshTokenEntity): Promise<void>;
  /** Çalıntı şüphesinde tüm oturum zincirini düşürür. */
  revokeFamily(familyId: string): Promise<void>;
  /** Şifre değişimi / deaktivasyon: kullanıcının tüm oturumları kapanır. */
  revokeAllForUser(userId: string): Promise<void>;
}
