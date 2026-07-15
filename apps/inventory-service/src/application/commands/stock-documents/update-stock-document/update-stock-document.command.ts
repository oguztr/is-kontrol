export class UpdateStockDocumentCommand {
  constructor(
    public readonly id: string,
    public readonly documentDate?: Date,
    public readonly partnerId?: string | null,
    public readonly exchangeRate?: string,
    public readonly notes?: string | null,
  ) {}
}
