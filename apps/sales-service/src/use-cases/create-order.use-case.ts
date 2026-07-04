import { Injectable } from '@nestjs/common';
import type { CreateOrderDto } from '@is-kontrol/sales-contracts';
import { SalesOrderEntity } from '../domain/entities/sales-order.entity';
import { SalesOrderItemEntity } from '../domain/entities/sales-order-item.entity';
import { SalesEventPublisher } from '../infrastructure/sales-event.publisher';

@Injectable()
export class CreateOrderUseCase {
  constructor(private readonly events: SalesEventPublisher) {}

  async execute(dto: CreateOrderDto) {
    const now = new Date();
    const orderId = crypto.randomUUID();
    const orderNumber = `ORD-${Date.now()}`;

    const items = dto.items.map(item =>
      new SalesOrderItemEntity(
        crypto.randomUUID(),
        orderId,
        item.productId,
        item.quantity,
        item.unitPrice,
        item.quantity * item.unitPrice
      )
    );

    const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0);

    const order = new SalesOrderEntity(
      orderId,
      orderNumber,
      dto.customerId,
      dto.quoteId ?? null,
      'PENDING',
      totalAmount,
      now
    );

    await this.events.orderCreated({
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      quoteId: order.quoteId ?? undefined,
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      itemCount: items.length,
    };
  }
}
