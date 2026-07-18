import { InvitationEntity } from "../../../../domain/entities/invitation.entity";
import { CompanyErrors } from "../../../../domain/errors/company.errors";
import type { CompanyError } from "../../../../domain/errors/company.errors";
import { UserErrors } from "../../../../domain/errors/user.errors";
import type { UserError } from "../../../../domain/errors/user.errors";
import type { ICompanyRepository } from "../../../../domain/repositories/company.repository.interface";
import type { IUserRepository } from "../../../../domain/repositories/user.repository.interface";
import type { IRoleRepository } from "../../../../domain/repositories/role.repository.interface";
import type { IInvitationRepository } from "../../../../domain/repositories/invitation.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { newOpaqueToken } from "../../auth/token.util";
import { InviteUserCommand } from "./invite-user.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export interface InviteUserResult {
  invitationId: string;
  /* Mailer altyapısı henüz yok: davet linki üretilebilsin diye token API
   * yanıtında döner. E-posta gönderimi eklendiğinde bu alan kaldırılıp
   * token yalnızca e-postayla iletilmelidir. */
  inviteToken: string;
  expiresAt: Date;
}

export class InviteUserHandler {
  constructor(
    private readonly companies: ICompanyRepository,
    private readonly users: IUserRepository,
    private readonly roles: IRoleRepository,
    private readonly invitations: IInvitationRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
    private readonly invitationTtlHours: number,
  ) {}

  async execute(
    command: InviteUserCommand,
  ): Promise<Result<InviteUserResult, CompanyError | UserError>> {
    const outcome = await this.unitOfWork.run<
      InviteUserResult | CompanyError | UserError
    >(async () => {
      if (!this.actor.allowsCompany(command.companyId)) {
        return CompanyErrors.notFound(command.companyId);
      }
      const company = await this.companies.findById(command.companyId);
      if (!company || !company.isActive) {
        return CompanyErrors.notFound(command.companyId);
      }

      const role = await this.roles.findById(command.roleId);
      if (!role || !role.assignableTo(company.id)) {
        return UserErrors.roleNotFound(command.roleId);
      }

      // E-posta global unique: başka firmada bile kayıtlıysa davet edilemez.
      if (await this.users.findByEmail(command.email)) {
        return UserErrors.emailAlreadyInUse(command.email);
      }
      if (await this.invitations.findPendingByEmail(company.id, command.email)) {
        return UserErrors.invitationAlreadyPending(command.email);
      }
      if (company.maxUsers !== null) {
        const activeCount = await this.users.countActiveByCompany(company.id);
        if (activeCount >= company.maxUsers) {
          return UserErrors.userLimitReached(company.id, company.maxUsers);
        }
      }

      const { token, tokenHash } = newOpaqueToken();
      const invitation = new InvitationEntity({
        id: crypto.randomUUID(),
        companyId: company.id,
        roleId: role.id,
        email: command.email,
        tokenHash,
        invitedByUserId:
          this.actor.userId() ?? command.invitedByUserId ?? company.id,
        expiresAt: new Date(
          Date.now() + this.invitationTtlHours * 60 * 60 * 1000,
        ),
        acceptedAt: null,
        revokedAt: null,
        createdAt: new Date(),
      });
      await this.invitations.save(invitation);

      return {
        invitationId: invitation.id,
        inviteToken: token,
        expiresAt: invitation.expiresAt,
      };
    });
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }
}
