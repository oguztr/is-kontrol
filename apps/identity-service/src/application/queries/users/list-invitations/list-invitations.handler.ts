import { CompanyErrors } from "../../../../domain/errors/company.errors";
import type { CompanyError } from "../../../../domain/errors/company.errors";
import type { IInvitationRepository } from "../../../../domain/repositories/invitation.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { ListInvitationsQuery } from "./list-invitations.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export interface InvitationListItem {
  id: string;
  email: string;
  roleId: string;
  invitedByUserId: string;
  expiresAt: Date;
  createdAt: Date;
}

export class ListInvitationsHandler {
  constructor(
    private readonly invitations: IInvitationRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: ListInvitationsQuery,
  ): Promise<Result<InvitationListItem[], CompanyError>> {
    if (!this.actor.allowsCompany(query.companyId)) {
      return new Failure(CompanyErrors.notFound(query.companyId));
    }
    const invitations = await this.invitations.listPendingByCompany(
      query.companyId,
    );
    return new Success(
      invitations.map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        roleId: invitation.roleId,
        invitedByUserId: invitation.invitedByUserId,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      })),
    );
  }
}
