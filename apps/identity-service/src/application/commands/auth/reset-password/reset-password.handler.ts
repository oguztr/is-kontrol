import { AuthErrors } from "../../../../domain/errors/auth.errors";
import type { AuthError } from "../../../../domain/errors/auth.errors";
import type { IUserRepository } from "../../../../domain/repositories/user.repository.interface";
import type { IOneTimeTokenRepository } from "../../../../domain/repositories/one-time-token.repository.interface";
import type { IRefreshTokenRepository } from "../../../../domain/repositories/refresh-token.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IPasswordHasherPort } from "../../../ports/password-hasher.port";
import { sha256Hex } from "../token.util";
import { ResetPasswordCommand } from "./reset-password.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class ResetPasswordHandler {
  constructor(
    private readonly users: IUserRepository,
    private readonly oneTimeTokens: IOneTimeTokenRepository,
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly passwordHasher: IPasswordHasherPort,
    private readonly unitOfWork: IUnitOfWorkPort,
  ) {}

  async execute(
    command: ResetPasswordCommand,
  ): Promise<Result<void, AuthError>> {
    const newHash = await this.passwordHasher.hash(command.newPassword);
    const tokenHash = sha256Hex(command.token);

    const error = await this.unitOfWork.run<AuthError | undefined>(
      async () => {
        const token = await this.oneTimeTokens.findByTokenHash(tokenHash);
        if (!token || token.purpose !== "PASSWORD_RESET" || !token.isUsable) {
          return AuthErrors.invalidOneTimeToken();
        }
        const user = await this.users.findByIdForUpdate(token.userId);
        if (!user || !user.isActive) {
          return AuthErrors.invalidOneTimeToken();
        }
        user.passwordHash = newHash;
        await this.users.update(user);
        token.markUsed();
        await this.oneTimeTokens.update(token);
        // Şifre sıfırlama olası bir ele geçirme sonrasıdır: tüm oturumlar kapanır.
        await this.refreshTokens.revokeAllForUser(user.id);
        return undefined;
      },
    );
    return error ? new Failure(error) : new Success(undefined);
  }
}
