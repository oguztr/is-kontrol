export type DocumentType =
  | "PURCHASE"
  | "SALE"
  | "TRANSFER"
  | "ADJUSTMENT"
  | "RETURN_IN"
  | "RETURN_OUT"
  | "PRODUCTION_IN"
  | "PRODUCTION_OUT"
  | "OPENING";

export type DocumentStatus = "DRAFT" | "POSTED" | "CANCELLED";

export class StockDocumentEntity {
  public readonly id: string;
  public readonly companyId: string;
  public readonly documentNumber: string;
  public readonly documentType: DocumentType;
  public status: DocumentStatus;
  public readonly warehouseId: string;
  public readonly targetWarehouseId: string | null;
  public readonly partnerId: string | null;
  public readonly currencyId: string;
  public exchangeRate: string;
  public readonly documentDate: Date;
  public notes: string | null;
  public readonly createdBy: string | null;
  public readonly createdAt: Date;

  constructor(params: {
    id: string;
    companyId: string;
    documentNumber: string;
    documentType: DocumentType;
    status: DocumentStatus;
    warehouseId: string;
    targetWarehouseId: string | null;
    partnerId: string | null;
    currencyId: string;
    exchangeRate: string;
    documentDate: Date;
    notes: string | null;
    createdBy: string | null;
    createdAt: Date;
  }) {
    this.id = params.id;
    this.companyId = params.companyId;
    this.documentNumber = params.documentNumber;
    this.documentType = params.documentType;
    this.status = params.status;
    this.warehouseId = params.warehouseId;
    this.targetWarehouseId = params.targetWarehouseId;
    this.partnerId = params.partnerId;
    this.currencyId = params.currencyId;
    this.exchangeRate = params.exchangeRate;
    this.documentDate = params.documentDate;
    this.notes = params.notes;
    this.createdBy = params.createdBy;
    this.createdAt = params.createdAt;
  }

  post(): void {
    this.status = "POSTED";
  }

  cancel(): void {
    this.status = "CANCELLED";
  }

  get isDraft(): boolean {
    return this.status === "DRAFT";
  }

  get isPosted(): boolean {
    return this.status === "POSTED";
  }
}
