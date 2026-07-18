export class UpsertCompanyProfileCommand {
  constructor(
    public readonly partnerId: string,
    public readonly tradeName: string,
    public readonly taxNumber: string | null,
    public readonly taxOffice: string | null,
    public readonly industry: string | null,
    public readonly website: string | null,
    public readonly parentPartnerId: string | null,
    public readonly paymentTermDays: number | null,
    public readonly preferredCurrencyCode: string | null,
  ) {}
}
