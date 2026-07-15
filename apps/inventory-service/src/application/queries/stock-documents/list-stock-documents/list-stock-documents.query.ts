import type {
  DocumentStatus,
  DocumentType,
} from "../../../../domain/entities/stock-document.entity";

export class ListStockDocumentsQuery {
  constructor(
    public readonly companyId: string,
    public readonly documentNumber?: string,
    public readonly documentType?: DocumentType,
    public readonly status?: DocumentStatus,
    public readonly dateFrom?: Date,
    public readonly dateTo?: Date,
    public readonly partnerId?: string,
    /** Kaynak veya hedef depo eşleşmesi. */
    public readonly warehouseId?: string,
  ) {}
}
