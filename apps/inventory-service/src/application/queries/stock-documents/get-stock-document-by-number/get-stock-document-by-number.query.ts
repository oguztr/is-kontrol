export class GetStockDocumentByNumberQuery {
  constructor(
    public readonly companyId: string,
    public readonly documentNumber: string,
  ) {}
}
