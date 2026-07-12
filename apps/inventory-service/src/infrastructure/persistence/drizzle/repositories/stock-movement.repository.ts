import { asc, eq } from 'drizzle-orm';
import type { IStockMovementRepository } from '../../../../domain/repositories/stock-movement.repository.interface'
import { StockMovementEntity } from '../../../../domain/entities/stock-movement.entity'
import type { MovementDirection } from '../../../../domain/entities/stock-movement.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { stockMovements } from '../schema'

export class DrizzleStockMovementRepository implements IStockMovementRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findByDocumentId(documentId: string): Promise<StockMovementEntity[]> {
    const rows = await this.db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.documentId, documentId))
      .orderBy(asc(stockMovements.lineNumber));
    return rows.map((r) => this.toEntity(r));
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
