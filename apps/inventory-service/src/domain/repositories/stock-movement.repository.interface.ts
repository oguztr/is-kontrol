import type { StockMovementEntity } from '../entities/stock-movement.entity'
import type { DocumentStatus } from '../entities/stock-document.entity'

export interface MovementListFilter {
  companyId: string;
  productId?: string;
  warehouseId?: string;
  /** Bağlı belgenin carisi üzerinden filtreler. */
  partnerId?: string;
  /** Bağlı belgenin durumu üzerinden filtreler (ör. yalnız POSTED). */
  documentStatus?: DocumentStatus;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}

export interface IStockMovementRepository {
  findById(id: string): Promise<StockMovementEntity | null>;
  findByDocumentId(documentId: string): Promise<StockMovementEntity[]>;
  list(filter: MovementListFilter): Promise<StockMovementEntity[]>;
  /** Aynı depo+ürün için kesinleşmiş bir açılış hareketi var mı? */
  hasPostedOpening(warehouseId: string, productId: string): Promise<boolean>;
  saveMany(movements: StockMovementEntity[]): Promise<void>;
  /** Taslak belgenin satırlarını topluca yeniler (sil + yeniden yaz). */
  replaceForDocument(documentId: string, movements: StockMovementEntity[]): Promise<void>;
  deleteByDocumentId(documentId: string): Promise<void>;
}
