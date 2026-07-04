import { Injectable } from '@nestjs/common';
import type { StockMovementDto } from '@is-kontrol/inventory-contracts';
import { StockMovementEntity } from '../domain/entities/stock-movement.entity';

@Injectable()
export class ReserveStockUseCase {
  execute(dto: StockMovementDto) {
    const movement = new StockMovementEntity(
      crypto.randomUUID(),
      dto.productId,
      dto.warehouseId,
      'RESERVE',
      dto.quantity,
      dto.referenceType as StockMovementEntity['referenceType'],
      dto.referenceId,
      new Date()
    );

    return { reserved: true, movementId: movement.id };
  }
}
