export class UpdateCompanyCommand {
  constructor(
    public readonly companyId: string,
    public readonly name: string | null,
    public readonly baseCurrencyCode: string | null,
    public readonly timezone: string | null,
    public readonly locale: string | null,
  ) {}
}
