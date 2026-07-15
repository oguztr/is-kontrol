export class UpdateStockDocumentLineCommand {
  constructor(
    public readonly documentId: string,
    public readonly lineNumber: number,
    public readonly productId?: string,
    public readonly unitId?: string,
    public readonly quantity?: string,
    public readonly unitPrice?: string,
    public readonly notes?: string | null,
  ) {}
}
