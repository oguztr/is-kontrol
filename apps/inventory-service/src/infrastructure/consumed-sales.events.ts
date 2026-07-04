/** Sales domain event'leri — inventory-service tüketici sözleşmesi (modül sınırı). */

export const ConsumedSalesTopics = {
  ORDER_CREATED: 'order.created',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_CANCELLED: 'order.cancelled',
} as const;

export interface OrderCreatedEvent {
  orderId: string;
  orderNumber: string;
  customerId: string;
  quoteId?: string;
  occurredAt: string;
}

export interface OrderConfirmedEvent {
  orderId: string;
  occurredAt: string;
}

export interface OrderShippedEvent {
  orderId: string;
  occurredAt: string;
}

export interface OrderCancelledEvent {
  orderId: string;
  reason?: string;
  occurredAt: string;
}
