export class AddStockDocumentLineCommand {
  constructor(
    public readonly documentId: string,
    public readonly productId: string,
    public readonly unitId: string,
    public readonly quantity: string,
    public readonly unitPrice: string,
    public readonly notes: string | null = null,
  ) {}
}
