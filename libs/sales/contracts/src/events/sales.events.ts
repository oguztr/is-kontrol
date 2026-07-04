export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type SalesOrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface QuoteCreatedEvent {
  quoteId: string;
  quoteNumber: string;
  customerId: string;
  occurredAt: string;
}

export interface QuoteUpdatedEvent {
  quoteId: string;
  status: QuoteStatus;
  occurredAt: string;
}

export interface QuoteSentEvent {
  quoteId: string;
  customerId: string;
  occurredAt: string;
}

export interface QuoteAcceptedEvent {
  quoteId: string;
  customerId: string;
  occurredAt: string;
}

export interface QuoteRejectedEvent {
  quoteId: string;
  reason?: string;
  occurredAt: string;
}

export interface QuoteExpiredEvent {
  quoteId: string;
  validUntil: string;
  occurredAt: string;
}

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

export interface OrderCompletedEvent {
  orderId: string;
  occurredAt: string;
}
