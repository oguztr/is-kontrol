import { OneTimeTokenEntity } from "../../../../domain/entities/one-time-token.entity";
import type { AuthError } from "../../../../domain/errors/auth.errors";
import type { IUserRepository } from "../../../../domain/repositories/user.repository.interface";
import type { IOneTimeTokenRepository } from "../../../../domain/repositories/one-time-token.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import { newOpaqueToken } from "../token.util";
import { RequestPasswordResetCommand } from "./request-password-reset.command";
import { Result, Success } from "@is-kontrol/shared-result";

export interface RequestPasswordResetResult {
  /* Mailer altyapısı henüz yok: reset linki üretilebilsin diye token API
   * yanıtında döner (e-posta kayıtlı değilse null — ama HTTP durumu her iki
   * halde de aynıdır). E-posta gönderimi eklendiğinde bu alan kaldırılmalı,
   * token yalnızca e-postayla iletilmelidir; aksi halde bu endpoint herkese
   * açık bir hesap ele geçirme kapısıdır. */
  resetToken: string | null;
  expiresAt: Date | null;
}

export class RequestPasswordResetHandler {
  constructor(
    private readonly users: IUserRepository,
    private readonly oneTimeTokens: IOneTimeTokenRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly passwordResetTtlMinutes: number,
  ) {}

  async execute(
    command: RequestPasswordResetCommand,
  ): Promise<Result<RequestPasswordResetResult, AuthError>> {
    const user = await this.users.findByEmail(command.email);
    // Hesap yoksa da başarı döner (enumeration önleme).
    if (!user || !user.isActive) {
      return new Success({ resetToken: null, expiresAt: null });
    }

    const { token, tokenHash } = newOpaqueToken();
    const expiresAt = new Date(
      Date.now() + this.passwordResetTtlMinutes * 60 * 1000,
    );
    await this.unitOfWork.run(async () => {
      await this.oneTimeTokens.invalidateAllForUser(user.id, "PASSWORD_RESET");
      await this.oneTimeTokens.save(
        new OneTimeTokenEntity({
          id: crypto.randomUUID(),
          userId: user.id,
          purpose: "PASSWORD_RESET",
          tokenHash,
          expiresAt,
          usedAt: null,
          createdAt: new Date(),
        }),
      );
    });
    return new Success({ resetToken: token, expiresAt });
  }
}
