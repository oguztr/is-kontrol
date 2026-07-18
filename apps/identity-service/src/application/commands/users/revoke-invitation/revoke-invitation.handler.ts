import { UserErrors } from "../../../../domain/errors/user.errors";
import type { UserError } from "../../../../domain/errors/user.errors";
import type { IInvitationRepository } from "../../../../domain/repositories/invitation.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { RevokeInvitationCommand } from "./revoke-invitation.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class RevokeInvitationHandler {
  constructor(
    private readonly invitations: IInvitationRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: RevokeInvitationCommand,
  ): Promise<Result<void, UserError>> {
    const error = await this.unitOfWork.run<UserError | undefined>(
      async () => {
        const invitation = await this.invitations.findById(
          command.invitationId,
        );
        if (!invitation || !this.actor.allowsCompany(invitation.companyId)) {
          return UserErrors.invitationNotFound(command.invitationId);
        }
        if (!invitation.isPending) {
          return UserErrors.invitationNotPending(invitation.id);
        }
        invitation.revoke();
        await this.invitations.update(invitation);
        return undefined;
      },
    );
    return error ? new Failure(error) : new Success(undefined);
  }
}
