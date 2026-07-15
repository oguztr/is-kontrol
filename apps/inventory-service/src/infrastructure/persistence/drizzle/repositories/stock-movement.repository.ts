import { asc, desc, eq, and, gte, lte } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { IStockMovementRepository, MovementListFilter } from '../../../../domain/repositories/stock-movement.repository.interface'
import { StockMovementEntity } from '../../../../domain/entities/stock-movement.entity'
import type { MovementDirection } from '../../../../domain/entities/stock-movement.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { stockDocuments, stockMovements } from '../schema'

export class DrizzleStockMovementRepository implements IStockMovementRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findById(id: string): Promise<StockMovementEntity | null> {
    const rows = await this.db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.id, id))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByDocumentId(documentId: string): Promise<StockMovementEntity[]> {
    const rows = await this.db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.documentId, documentId))
      .orderBy(asc(stockMovements.lineNumber));
    return rows.map((r) => this.toEntity(r));
  }

  async list(filter: MovementListFilter): Promise<StockMovementEntity[]> {
    const conditions: SQL[] = [eq(stockMovements.companyId, filter.companyId)];
    if (filter.productId) conditions.push(eq(stockMovements.productId, filter.productId));
    if (filter.warehouseId) conditions.push(eq(stockMovements.warehouseId, filter.warehouseId));
    if (filter.partnerId) conditions.push(eq(stockDocuments.partnerId, filter.partnerId));
    if (filter.documentStatus) conditions.push(eq(stockDocuments.status, filter.documentStatus));
    if (filter.dateFrom) conditions.push(gte(stockMovements.createdAt, filter.dateFrom));
    if (filter.dateTo) conditions.push(lte(stockMovements.createdAt, filter.dateTo));
    const query = this.db
      .select({ movement: stockMovements })
      .from(stockMovements)
      .innerJoin(stockDocuments, eq(stockMovements.documentId, stockDocuments.id))
      .where(and(...conditions))
      .orderBy(desc(stockMovements.createdAt), asc(stockMovements.lineNumber));
    const rows = filter.limit ? await query.limit(filter.limit) : await query;
    return rows.map((r) => this.toEntity(r.movement));
  }

  async hasPostedOpening(warehouseId: string, productId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: stockMovements.id })
      .from(stockMovements)
      .innerJoin(stockDocuments, eq(stockMovements.documentId, stockDocuments.id))
      .where(and(
        eq(stockMovements.warehouseId, warehouseId),
        eq(stockMovements.productId, productId),
        eq(stockDocuments.documentType, 'OPENING'),
        eq(stockDocuments.status, 'POSTED'),
      ))
      .limit(1);
    return rows.length > 0;
  }

  async saveMany(movements: StockMovementEntity[]): Promise<void> {
    if (movements.length === 0) return;
    await this.db.insert(stockMovements).values(
      movements.map((m) => ({
        id: m.id,
        companyId: m.companyId,
        documentId: m.documentId,
        lineNumber: m.lineNumber,
        productId: m.productId,
        warehouseId: m.warehouseId,
        direction: m.direction,
        unitId: m.unitId,
        quantity: m.quantity,
        baseQuantity: m.baseQuantity,
        unitPrice: m.unitPrice,
        currencyId: m.currencyId,
        exchangeRate: m.exchangeRate,
        totalAmount: m.totalAmount,
        totalAmountBaseCurrency: m.totalAmountBaseCurrency,
        notes: m.notes ?? undefined,
        createdAt: m.createdAt,
      })),
    );
  }

  async replaceForDocument(documentId: string, movements: StockMovementEntity[]): Promise<void> {
    await this.db.delete(stockMovements).where(eq(stockMovements.documentId, documentId));
    await this.saveMany(movements);
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    await this.db.delete(stockMovements).where(eq(stockMovements.documentId, documentId));
  }

  private toEntity(row: typeof stockMovements.$inferSelect): StockMovementEntity {
    return new StockMovementEntity({
      id: row.id,
      companyId: row.companyId,
      documentId: row.documentId,
      lineNumber: row.lineNumber,
      productId: row.productId,
      warehouseId: row.warehouseId,
      direction: row.direction as MovementDirection,
      unitId: row.unitId,
      quantity: row.quantity,
      baseQuantity: row.baseQuantity,
      unitPrice: row.unitPrice,
      currencyId: row.currencyId,
      exchangeRate: row.exchangeRate,
      totalAmount: row.totalAmount,
      totalAmountBaseCurrency: row.totalAmountBaseCurrency,
      notes: row.notes ?? null,
      createdAt: row.createdAt,
    });
  }
}
