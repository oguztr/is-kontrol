import { AuthErrors } from "../../../../domain/errors/auth.errors";
import type { AuthError } from "../../../../domain/errors/auth.errors";
import type { IUserRepository } from "../../../../domain/repositories/user.repository.interface";
import type { ICompanyRepository } from "../../../../domain/repositories/company.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IPasswordHasherPort } from "../../../ports/password-hasher.port";
import { AuthSessionFactory } from "../auth-session.factory";
import { LoginCommand } from "./login.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export interface LoginResult {
  accessToken: string;
  expiresInSeconds: number;
  refreshToken: string;
  user: {
    id: string;
    companyId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export class LoginHandler {
  constructor(
    private readonly users: IUserRepository,
    private readonly companies: ICompanyRepository,
    private readonly passwordHasher: IPasswordHasherPort,
    private readonly sessionFactory: AuthSessionFactory,
    private readonly unitOfWork: IUnitOfWorkPort,
  ) {}

  async execute(command: LoginCommand): Promise<Result<LoginResult, AuthError>> {
    const user = await this.users.findByEmail(command.email);
    // Kullanıcı yokken de hash doğrulaması koşturulur: yanıt süresi "e-posta
    // kayıtlı mı" bilgisini sızdırmasın (timing side-channel).
    const passwordMatches = await this.passwordHasher.verify(
      command.password,
      user?.passwordHash ?? DUMMY_HASH,
    );
    if (!user || !passwordMatches) {
      return new Failure(AuthErrors.invalidCredentials());
    }
    if (!user.isActive) return new Failure(AuthErrors.userDeactivated());

    const company = await this.companies.findById(user.companyId);
    if (!company || !company.isActive) {
      return new Failure(AuthErrors.companySuspended());
    }

    const result = await this.unitOfWork.run<LoginResult>(async () => {
      user.recordLogin();
      await this.users.update(user);
      const session = await this.sessionFactory.issue(user, {
        userAgent: command.userAgent,
        ipAddress: command.ipAddress,
      });
      return {
        accessToken: session.accessToken,
        expiresInSeconds: session.expiresInSeconds,
        refreshToken: session.refreshToken,
        user: {
          id: user.id,
          companyId: user.companyId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: session.roleCode,
        },
      };
    });
    return new Success(result);
  }
}

/* Geçerli formatta ama hiçbir şifreyle eşleşmeyen sabit scrypt hash'i;
 * yalnız timing eşitleme için kullanılır. */
const DUMMY_HASH =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAA";
