export class RemoveStockDocumentLineCommand {
  constructor(
    public readonly documentId: string,
    public readonly lineNumber: number,
  ) {}
}
