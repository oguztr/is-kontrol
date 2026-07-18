import { AuthErrors } from "../../../../domain/errors/auth.errors";
import type { AuthError } from "../../../../domain/errors/auth.errors";
import type { IUserRepository } from "../../../../domain/repositories/user.repository.interface";
import type { IRefreshTokenRepository } from "../../../../domain/repositories/refresh-token.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import type { IPasswordHasherPort } from "../../../ports/password-hasher.port";
import { ChangePasswordCommand } from "./change-password.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class ChangePasswordHandler {
  constructor(
    private readonly users: IUserRepository,
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly passwordHasher: IPasswordHasherPort,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: ChangePasswordCommand,
  ): Promise<Result<void, AuthError>> {
    const user = await this.users.findById(command.userId);
    if (!user || !this.actor.allowsCompany(user.companyId) || !user.isActive) {
      return new Failure(AuthErrors.invalidCredentials());
    }
    const matches = await this.passwordHasher.verify(
      command.currentPassword,
      user.passwordHash,
    );
    if (!matches) return new Failure(AuthErrors.currentPasswordMismatch());

    const newHash = await this.passwordHasher.hash(command.newPassword);
    await this.unitOfWork.run(async () => {
      const locked = await this.users.findByIdForUpdate(user.id);
      if (!locked) return;
      locked.passwordHash = newHash;
      await this.users.update(locked);
      // Şifre değişince tüm oturumlar kapanır; istemci yeniden login olur.
      await this.refreshTokens.revokeAllForUser(locked.id);
    });
    return new Success(undefined);
  }
}
