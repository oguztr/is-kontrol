import { Injectable, Logger } from '@nestjs/common';
import type {
  StockReservedEvent,
  StockReleasedEvent,
} from '../infrastructure/consumed-inventory.events';

@Injectable()
export class HandleInventoryEventUseCase {
  private readonly logger = new Logger(HandleInventoryEventUseCase.name);

  onStockReserved(event: StockReservedEvent) {
    this.logger.log(
      `Stok rezerve edildi: ${event.productId} (miktar: ${event.quantity}, referans: ${event.referenceId})`
    );
    return { handled: 'stock.reserved', productId: event.productId };
  }

  onStockReleased(event: StockReleasedEvent) {
    this.logger.log(
      `Stok serbest bırakıldı: ${event.productId} (miktar: ${event.quantity}, referans: ${event.referenceId})`
    );
    return { handled: 'stock.released', productId: event.productId };
  }
}
