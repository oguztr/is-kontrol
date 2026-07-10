import type { DocumentType } from "../../../../domain/entities/stock-document.entity";

export interface StockDocumentLineInput {
  productId: string;
  unitId: string;
  quantity: string;
  unitPrice: string;
  notes: string | null;
}

export class CreateStockDocumentCommand {
  constructor(
    public readonly companyId: string,
    public readonly documentNumber: string,
    public readonly documentType: DocumentType,
    public readonly warehouseId: string,
    public readonly currencyId: string,
    public readonly documentDate: Date,
    public readonly lines: StockDocumentLineInput[],
    public readonly targetWarehouseId: string | null = null,
    public readonly partnerId: string | null = null,
    public readonly exchangeRate = "1",
    public readonly notes: string | null = null,
    public readonly createdBy: string | null = null,
  ) {}
}
