import { CompanyEntity } from "../../../../domain/entities/company.entity";
import { UserEntity } from "../../../../domain/entities/user.entity";
import { UserErrors } from "../../../../domain/errors/user.errors";
import type { UserError } from "../../../../domain/errors/user.errors";
import type { ICompanyRepository } from "../../../../domain/repositories/company.repository.interface";
import type { IUserRepository } from "../../../../domain/repositories/user.repository.interface";
import type { IRoleRepository } from "../../../../domain/repositories/role.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IPasswordHasherPort } from "../../../ports/password-hasher.port";
import { companySnapshotPayload } from "../company-event.payload";
import { userSnapshotPayload } from "../../users/user-event.payload";
import { SignUpCommand } from "./sign-up.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

/* Sign-up tek işlemdir: Company ve OWNER rolündeki ilk User aynı
 * transaction'da doğar — yarım kalmış firma (sahipsiz tenant) oluşamaz. */
export class SignUpHandler {
  constructor(
    private readonly companies: ICompanyRepository,
    private readonly users: IUserRepository,
    private readonly roles: IRoleRepository,
    private readonly passwordHasher: IPasswordHasherPort,
    private readonly eventPublisher: IEventPublisherPort,
    private readonly unitOfWork: IUnitOfWorkPort,
  ) {}

  async execute(
    command: SignUpCommand,
  ): Promise<Result<{ companyId: string; userId: string }, UserError>> {
    // Hash CPU-yoğun; transaction dışında hesaplanır, kilit süresi kısalır.
    const passwordHash = await this.passwordHasher.hash(command.password);

    const outcome = await this.unitOfWork.run<
      { companyId: string; userId: string } | UserError
    >(async () => {
      const existing = await this.users.findByEmail(command.email);
      if (existing) return UserErrors.emailAlreadyInUse(command.email);

      const ownerRole = await this.roles.findByCode("OWNER", null);
      // Sistem rolleri açılışta seed'lenir; yokluğu konfigürasyon hatasıdır.
      if (!ownerRole) throw new Error("OWNER system role is not seeded");

      const company = new CompanyEntity({
        id: crypto.randomUUID(),
        name: command.companyName,
        baseCurrencyCode: command.baseCurrencyCode,
        timezone: command.timezone,
        locale: command.locale,
        status: "ACTIVE",
        suspendedAt: null,
        planTier: "FREE",
        maxUsers: null,
        featureFlags: {},
        createdAt: new Date(),
        deletedAt: null,
      });
      await this.companies.save(company);

      const user = new UserEntity({
        id: crypto.randomUUID(),
        companyId: company.id,
        roleId: ownerRole.id,
        email: command.email,
        passwordHash,
        firstName: command.firstName,
        lastName: command.lastName,
        phone: null,
        avatarUrl: null,
        status: "ACTIVE",
        emailVerifiedAt: null,
        lastLoginAt: null,
        createdAt: new Date(),
        deletedAt: null,
      });
      await this.users.save(user);

      await this.eventPublisher.publish({
        aggregateType: "Company",
        aggregateId: company.id,
        eventType: "company.created",
        payload: companySnapshotPayload(company),
      });
      await this.eventPublisher.publish({
        aggregateType: "User",
        aggregateId: user.id,
        eventType: "user.created",
        payload: userSnapshotPayload(user),
      });

      return { companyId: company.id, userId: user.id };
    });
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }
}
