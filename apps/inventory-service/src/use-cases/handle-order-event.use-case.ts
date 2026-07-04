import { Injectable, Logger } from '@nestjs/common';
import type {
  OrderCancelledEvent,
  OrderConfirmedEvent,
  OrderCreatedEvent,
  OrderShippedEvent,
} from '../infrastructure/consumed-sales.events';

@Injectable()
export class HandleOrderEventUseCase {
  private readonly logger = new Logger(HandleOrderEventUseCase.name);

  onCreated(event: OrderCreatedEvent) {
    this.logger.log(
      `Sipariş ${event.orderNumber} için stok rezervasyonu bekleniyor (quoteId: ${event.quoteId ?? 'yok'})`
    );
    return { handled: 'order.created', orderId: event.orderId };
  }

  onConfirmed(event: OrderConfirmedEvent) {
    this.logger.log(`Sipariş ${event.orderId} onaylandı — rezervasyon korunuyor`);
    return { handled: 'order.confirmed', orderId: event.orderId };
  }

  onShipped(event: OrderShippedEvent) {
    this.logger.log(
      `Sipariş ${event.orderId} sevk edildi — stok düşümü persistence katmanı eklendiğinde tetiklenecek`
    );
    return { handled: 'order.shipped', orderId: event.orderId };
  }

  onCancelled(event: OrderCancelledEvent) {
    this.logger.log(
      `Sipariş ${event.orderId} iptal edildi — rezervasyon serbest bırakılacak (sebep: ${event.reason ?? 'belirtilmedi'})`
    );
    return { handled: 'order.cancelled', orderId: event.orderId };
  }
}
