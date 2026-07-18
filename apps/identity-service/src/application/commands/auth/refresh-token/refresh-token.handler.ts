import { AuthErrors } from "../../../../domain/errors/auth.errors";
import type { AuthError } from "../../../../domain/errors/auth.errors";
import type { IRefreshTokenRepository } from "../../../../domain/repositories/refresh-token.repository.interface";
import type { IUserRepository } from "../../../../domain/repositories/user.repository.interface";
import type { ICompanyRepository } from "../../../../domain/repositories/company.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import { AuthSessionFactory } from "../auth-session.factory";
import { sha256Hex } from "../token.util";
import { RefreshTokenCommand } from "./refresh-token.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export interface RefreshResult {
  accessToken: string;
  expiresInSeconds: number;
  refreshToken: string;
}

/* Rotasyon: her yenilemede eski token düşürülür, aynı family içinde yenisi
 * verilir. Düşürülmüş bir token'ın tekrar görülmesi çalıntı işaretidir —
 * tüm family kapatılır ve istemci yeniden login'e zorlanır. Firma/kullanıcı
 * durum kontrolleri burada yapıldığından askıya alınan hesap en geç access
 * token TTL'i (15 dk) içinde sistemden düşer. */
export class RefreshTokenHandler {
  constructor(
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly users: IUserRepository,
    private readonly companies: ICompanyRepository,
    private readonly sessionFactory: AuthSessionFactory,
    private readonly unitOfWork: IUnitOfWorkPort,
  ) {}

  async execute(
    command: RefreshTokenCommand,
  ): Promise<Result<RefreshResult, AuthError>> {
    const tokenHash = sha256Hex(command.refreshToken);
    const outcome = await this.unitOfWork.run<RefreshResult | AuthError>(
      async () => {
        const current = await this.refreshTokens.findByTokenHash(tokenHash);
        if (!current) return AuthErrors.invalidRefreshToken();
        if (current.isRevoked) {
          await this.refreshTokens.revokeFamily(current.familyId);
          return AuthErrors.refreshTokenReused();
        }
        if (current.isExpired) return AuthErrors.invalidRefreshToken();

        const user = await this.users.findById(current.userId);
        if (!user || !user.isActive) return AuthErrors.userDeactivated();
        const company = await this.companies.findById(user.companyId);
        if (!company || !company.isActive) {
          return AuthErrors.companySuspended();
        }

        const session = await this.sessionFactory.issue(user, {
          userAgent: command.userAgent,
          ipAddress: command.ipAddress,
          familyId: current.familyId,
        });
        current.revoke(session.refreshTokenId);
        await this.refreshTokens.update(current);

        return {
          accessToken: session.accessToken,
          expiresInSeconds: session.expiresInSeconds,
          refreshToken: session.refreshToken,
        };
      },
    );
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }
}
