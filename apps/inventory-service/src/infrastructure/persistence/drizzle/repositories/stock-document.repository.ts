import { eq, and, or, gte, lte, desc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { IStockDocumentRepository, StockDocumentListFilter } from '../../../../domain/repositories/stock-document.repository.interface'
import { StockDocumentEntity } from '../../../../domain/entities/stock-document.entity'
import type { DocumentType, DocumentStatus } from '../../../../domain/entities/stock-document.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { stockDocuments } from '../schema'

export class DrizzleStockDocumentRepository implements IStockDocumentRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findById(id: string): Promise<StockDocumentEntity | null> {
    const rows = await this.db.select().from(stockDocuments).where(eq(stockDocuments.id, id)).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByIdForUpdate(id: string): Promise<StockDocumentEntity | null> {
    const rows = await this.db
      .select()
      .from(stockDocuments)
      .where(eq(stockDocuments.id, id))
      .limit(1)
      .for('update');
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

  async list(filter: StockDocumentListFilter): Promise<StockDocumentEntity[]> {
    const conditions: SQL[] = [eq(stockDocuments.companyId, filter.companyId)];
    if (filter.documentNumber) conditions.push(eq(stockDocuments.documentNumber, filter.documentNumber));
    if (filter.documentType) conditions.push(eq(stockDocuments.documentType, filter.documentType));
    if (filter.status) conditions.push(eq(stockDocuments.status, filter.status));
    if (filter.dateFrom) conditions.push(gte(stockDocuments.documentDate, filter.dateFrom));
    if (filter.dateTo) conditions.push(lte(stockDocuments.documentDate, filter.dateTo));
    if (filter.partnerId) conditions.push(eq(stockDocuments.partnerId, filter.partnerId));
    if (filter.warehouseId) {
      conditions.push(
        or(
          eq(stockDocuments.warehouseId, filter.warehouseId),
          eq(stockDocuments.targetWarehouseId, filter.warehouseId),
        ) as SQL,
      );
    }
    const rows = await this.db
      .select()
      .from(stockDocuments)
      .where(and(...conditions))
      .orderBy(desc(stockDocuments.documentDate), desc(stockDocuments.createdAt));
    return rows.map((row) => this.toEntity(row));
  }

  async save(document: StockDocumentEntity): Promise<boolean> {
    const inserted = await this.db
      .insert(stockDocuments)
      .values({
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
      })
      .onConflictDoNothing({
        target: [stockDocuments.companyId, stockDocuments.documentNumber],
      })
      .returning({ id: stockDocuments.id });
    return inserted.length > 0;
  }

  async update(document: StockDocumentEntity): Promise<void> {
    await this.db
      .update(stockDocuments)
      .set({
        status: document.status,
        documentDate: document.documentDate,
        partnerId: document.partnerId,
        exchangeRate: document.exchangeRate,
        notes: document.notes,
      })
      .where(eq(stockDocuments.id, document.id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(stockDocuments).where(eq(stockDocuments.id, id));
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
