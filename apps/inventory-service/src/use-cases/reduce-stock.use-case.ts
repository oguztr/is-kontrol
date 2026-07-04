import { Injectable } from '@nestjs/common';
import type { StockMovementDto } from '@is-kontrol/inventory-contracts';
import { StockMovementEntity } from '../domain/entities/stock-movement.entity';

@Injectable()
export class ReduceStockUseCase {
  execute(dto: StockMovementDto) {
    const movement = new StockMovementEntity(
      crypto.randomUUID(),
      dto.productId,
      dto.warehouseId,
      'OUT',
      dto.quantity,
      dto.referenceType as StockMovementEntity['referenceType'],
      dto.referenceId,
      new Date()
    );

    return { reduced: true, movementId: movement.id };
  }
}
