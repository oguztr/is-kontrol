import { Injectable } from '@nestjs/common';
import type { StockMovementDto } from '@is-kontrol/inventory-contracts';
import { StockMovementEntity } from '../domain/entities/stock-movement.entity';
import { InventoryEventPublisher } from '../infrastructure/inventory-event.publisher';

@Injectable()
export class ReserveStockUseCase {
  constructor(private readonly events: InventoryEventPublisher) {}

  async execute(dto: StockMovementDto) {
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

    await this.events.stockReserved({
      productId: movement.productId,
      warehouseId: movement.warehouseId,
      quantity: movement.quantity,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
    });

    return { reserved: true, movementId: movement.id };
  }
}
