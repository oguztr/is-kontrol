export class UpdateContactCommand {
  constructor(
    public readonly contactId: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly title: string | null,
    public readonly department: string | null,
    public readonly phone: string | null,
    public readonly email: string | null,
  ) {}
}
