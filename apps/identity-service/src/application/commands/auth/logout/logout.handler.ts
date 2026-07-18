import type { AuthError } from "../../../../domain/errors/auth.errors";
import type { IRefreshTokenRepository } from "../../../../domain/repositories/refresh-token.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import { sha256Hex } from "../token.util";
import { LogoutCommand } from "./logout.command";
import { Result, Success } from "@is-kontrol/shared-result";

/* Idempotent: token bilinmiyor/zaten düşmüşse de başarı döner — çıkış
 * denemesi hiçbir durumda hata göstermez. Family komple kapatılır (aynı
 * cihazın rotasyon zinciri). Access token'lar stateless olduğundan TTL
 * sonuna dek geçerli kalır. */
export class LogoutHandler {
  constructor(
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
  ) {}

  async execute(command: LogoutCommand): Promise<Result<void, AuthError>> {
    await this.unitOfWork.run(async () => {
      const token = await this.refreshTokens.findByTokenHash(
        sha256Hex(command.refreshToken),
      );
      if (token) await this.refreshTokens.revokeFamily(token.familyId);
    });
    return new Success(undefined);
  }
}
