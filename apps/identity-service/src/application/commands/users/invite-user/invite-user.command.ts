export class InviteUserCommand {
  constructor(
    public readonly companyId: string,
    public readonly email: string,
    public readonly roleId: string,
    public readonly invitedByUserId: string | null,
  ) {}
}
