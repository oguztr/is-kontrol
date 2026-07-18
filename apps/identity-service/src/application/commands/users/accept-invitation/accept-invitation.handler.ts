import { UserEntity } from "../../../../domain/entities/user.entity";
import { UserErrors } from "../../../../domain/errors/user.errors";
import type { UserError } from "../../../../domain/errors/user.errors";
import type { IInvitationRepository } from "../../../../domain/repositories/invitation.repository.interface";
import type { IUserRepository } from "../../../../domain/repositories/user.repository.interface";
import type { ICompanyRepository } from "../../../../domain/repositories/company.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IPasswordHasherPort } from "../../../ports/password-hasher.port";
import { sha256Hex } from "../../auth/token.util";
import { userSnapshotPayload } from "../user-event.payload";
import { AcceptInvitationCommand } from "./accept-invitation.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

/* Public endpoint'tir (davet linkinden gelinir). Token hash ile bulunur;
 * kullanıcı şifresiyle birlikte burada doğar. Davet e-postayla ulaştığı
 * için e-posta doğrulanmış kabul edilir. */
export class AcceptInvitationHandler {
  constructor(
    private readonly invitations: IInvitationRepository,
    private readonly users: IUserRepository,
    private readonly companies: ICompanyRepository,
    private readonly passwordHasher: IPasswordHasherPort,
    private readonly eventPublisher: IEventPublisherPort,
    private readonly unitOfWork: IUnitOfWorkPort,
  ) {}

  async execute(
    command: AcceptInvitationCommand,
  ): Promise<Result<{ userId: string; companyId: string }, UserError>> {
    const passwordHash = await this.passwordHasher.hash(command.password);
    const tokenHash = sha256Hex(command.token);

    const outcome = await this.unitOfWork.run<
      { userId: string; companyId: string } | UserError
    >(async () => {
      const invitation = await this.invitations.findByTokenHash(tokenHash);
      // Token bilinmiyorsa hangi davete ait olduğu da bilinmez; sızdırma.
      if (!invitation) return UserErrors.invitationNotFound("unknown");
      if (!invitation.isPending) {
        return UserErrors.invitationNotPending(invitation.id);
      }
      if (invitation.isExpired) {
        return UserErrors.invitationExpired(invitation.id);
      }

      const company = await this.companies.findById(invitation.companyId);
      if (!company || !company.isActive) {
        return UserErrors.invitationNotPending(invitation.id);
      }
      // Davet beklerken aynı e-posta başka yoldan kayıt olmuş olabilir.
      if (await this.users.findByEmail(invitation.email)) {
        return UserErrors.emailAlreadyInUse(invitation.email);
      }

      const user = new UserEntity({
        id: crypto.randomUUID(),
        companyId: invitation.companyId,
        roleId: invitation.roleId,
        email: invitation.email,
        passwordHash,
        firstName: command.firstName,
        lastName: command.lastName,
        phone: command.phone,
        avatarUrl: null,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        lastLoginAt: null,
        createdAt: new Date(),
        deletedAt: null,
      });
      await this.users.save(user);

      invitation.accept();
      await this.invitations.update(invitation);

      await this.eventPublisher.publish({
        aggregateType: "User",
        aggregateId: user.id,
        eventType: "user.created",
        payload: userSnapshotPayload(user),
      });

      return { userId: user.id, companyId: user.companyId };
    });
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }
}
