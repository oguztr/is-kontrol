import { eq, and } from 'drizzle-orm';
import type { IStockDocumentRepository } from '../../../../domain/repositories/stock-document.repository.interface'
import { StockDocumentEntity } from '../../../../domain/entities/stock-document.entity'
import type { DocumentType, DocumentStatus } from '../../../../domain/entities/stock-document.entity'
import type { WriteDb } from '../drizzle.provider'
import { stockDocuments } from '../schema'

export class DrizzleStockDocumentRepository implements IStockDocumentRepository {
  constructor(private readonly db: WriteDb) {}

  async findById(id: string): Promise<StockDocumentEntity | null> {
    const rows = await this.db.select().from(stockDocuments).where(eq(stockDocuments.id, id)).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByDocumentNumber(companyId: string, documentNumber: string): Promise<StockDocumentEntity | null> {
    const rows = await this.db
      .select()
      .from(stockDocuments)
      .where(and(eq(stockDocuments.companyId, companyId), eq(stockDocuments.documentNumber, documentNumber)))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async save(document: StockDocumentEntity): Promise<void> {
    await this.db.insert(stockDocuments).values({
      id: document.id,
      companyId: document.companyId,
      documentNumber: document.documentNumber,
      documentType: document.documentType,
      status: document.status,
      warehouseId: document.warehouseId,
      targetWarehouseId: document.targetWarehouseId ?? undefined,
      partnerId: document.partnerId ?? undefined,
      currencyId: document.currencyId,
      exchangeRate: document.exchangeRate,
      documentDate: document.documentDate,
      notes: document.notes ?? undefined,
      createdBy: document.createdBy ?? undefined,
      createdAt: document.createdAt,
    });
  }

  async update(document: StockDocumentEntity): Promise<void> {
    await this.db
      .update(stockDocuments)
      .set({ status: document.status, notes: document.notes ?? undefined })
      .where(eq(stockDocuments.id, document.id));
  }

  private toEntity(row: typeof stockDocuments.$inferSelect): StockDocumentEntity {
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
}
