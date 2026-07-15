export class CreateWarehouseCommand {
  constructor(
    public readonly companyId: string,
    public readonly code: string,
    public readonly name: string,
    public readonly address: string | null = null,
  ) {}
}
