import { StockDocumentEntity } from '../../../../domain/entities/stock-document.entity'
import type { DocumentType, DocumentStatus } from '../../../../domain/entities/stock-document.entity'
import type { stockDocuments } from '../schema'

type StockDocumentRow = typeof stockDocuments.$inferSelect;

export class StockDocumentMapper {
  static toDomain(row: StockDocumentRow): StockDocumentEntity {
    return new StockDocumentEntity({
      id: row.id,
      companyId: row.companyId,
      documentNumber: row.documentNumber,
      documentType: row.documentType as DocumentType,
      status: row.status as DocumentStatus,
      warehouseId: row.warehouseId,
      targetWarehouseId: row.targetWarehouseId ?? null,
      partnerId: row.partnerId ?? null,
      currencyId: row.currencyId,
      exchangeRate: row.exchangeRate,
      documentDate: row.documentDate,
      notes: row.notes ?? null,
      createdBy: row.createdBy ?? null,
      createdAt: row.createdAt,
    });
  }

  static toPersistence(entity: StockDocumentEntity): Omit<StockDocumentRow, 'updatedAt' | 'deletedAt'> {
    return {
      id: entity.id,
      companyId: entity.companyId,
      documentNumber: entity.documentNumber,
      documentType: entity.documentType,
      status: entity.status,
      warehouseId: entity.warehouseId,
      targetWarehouseId: entity.targetWarehouseId,
      partnerId: entity.partnerId,
      currencyId: entity.currencyId,
      exchangeRate: entity.exchangeRate,
      documentDate: entity.documentDate,
      notes: entity.notes,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
    };
  }
}
