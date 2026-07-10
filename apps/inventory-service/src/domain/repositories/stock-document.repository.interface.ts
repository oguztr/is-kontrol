import type { StockDocumentEntity } from '../entities/stock-document.entity'

export interface IStockDocumentRepository {
  findById(id: string): Promise<StockDocumentEntity | null>;
  findByDocumentNumber(companyId: string, documentNumber: string): Promise<StockDocumentEntity | null>;
  save(document: StockDocumentEntity): Promise<void>;
  update(document: StockDocumentEntity): Promise<void>;
}
