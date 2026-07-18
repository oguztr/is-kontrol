import type { InvitationEntity } from "../entities/invitation.entity";

export interface IInvitationRepository {
  findById(id: string): Promise<InvitationEntity | null>;
  findByTokenHash(tokenHash: string): Promise<InvitationEntity | null>;
  findPendingByEmail(
    companyId: string,
    email: string,
  ): Promise<InvitationEntity | null>;
  save(invitation: InvitationEntity): Promise<void>;
  update(invitation: InvitationEntity): Promise<void>;
  listPendingByCompany(companyId: string): Promise<InvitationEntity[]>;
}
