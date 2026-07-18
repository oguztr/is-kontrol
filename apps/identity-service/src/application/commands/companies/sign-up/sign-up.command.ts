export class SignUpCommand {
  constructor(
    public readonly companyName: string,
    public readonly baseCurrencyCode: string,
    public readonly timezone: string,
    public readonly locale: string,
    public readonly email: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
  ) {}
}
