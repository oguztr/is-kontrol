import type { StockDocumentEntity } from '../entities/stock-document.entity'

export interface IStockDocumentRepository {
  findById(id: string): Promise<StockDocumentEntity | null>;
  findByIdForUpdate(id: string): Promise<StockDocumentEntity | null>;
  findByDocumentNumber(companyId: string, documentNumber: string): Promise<StockDocumentEntity | null>;
  /** false, aynı company+documentNumber zaten oluşturuldu demektir. */
  save(document: StockDocumentEntity): Promise<boolean>;
  update(document: StockDocumentEntity): Promise<void>;
}
