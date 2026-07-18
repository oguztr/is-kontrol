export class AcceptInvitationCommand {
  constructor(
    public readonly token: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly phone: string | null,
  ) {}
}
