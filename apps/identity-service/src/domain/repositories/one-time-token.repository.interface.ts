import type {
  OneTimeTokenEntity,
  OneTimeTokenPurpose,
} from "../entities/one-time-token.entity";

export interface IOneTimeTokenRepository {
  findByTokenHash(tokenHash: string): Promise<OneTimeTokenEntity | null>;
  save(token: OneTimeTokenEntity): Promise<void>;
  update(token: OneTimeTokenEntity): Promise<void>;
  /** Yeni token üretilirken aynı amaçlı eski token'lar geçersiz kılınır. */
  invalidateAllForUser(
    userId: string,
    purpose: OneTimeTokenPurpose,
  ): Promise<void>;
}
