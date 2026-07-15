import type { StockDocumentEntity, DocumentType, DocumentStatus } from '../entities/stock-document.entity'

export interface StockDocumentListFilter {
  companyId: string;
  documentNumber?: string;
  documentType?: DocumentType;
  status?: DocumentStatus;
  dateFrom?: Date;
  dateTo?: Date;
  partnerId?: string;
  /** Kaynak veya hedef depo eşleşmesi. */
  warehouseId?: string;
}

export interface IStockDocumentRepository {
  findById(id: string): Promise<StockDocumentEntity | null>;
  findByIdForUpdate(id: string): Promise<StockDocumentEntity | null>;
  findByDocumentNumber(companyId: string, documentNumber: string): Promise<StockDocumentEntity | null>;
  list(filter: StockDocumentListFilter): Promise<StockDocumentEntity[]>;
  /** false, aynı company+documentNumber zaten oluşturuldu demektir. */
  save(document: StockDocumentEntity): Promise<boolean>;
  update(document: StockDocumentEntity): Promise<void>;
  delete(id: string): Promise<void>;
}
