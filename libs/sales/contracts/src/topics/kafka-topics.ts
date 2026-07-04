/** Quote / Order Kafka topic names */
export const SalesKafkaTopics = {
  QUOTE_CREATED: 'quote.created',
  QUOTE_UPDATED: 'quote.updated',
  QUOTE_SENT: 'quote.sent',
  QUOTE_ACCEPTED: 'quote.accepted',
  QUOTE_REJECTED: 'quote.rejected',
  QUOTE_EXPIRED: 'quote.expired',
  ORDER_CREATED: 'order.created',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_COMPLETED: 'order.completed',
} as const;

export type SalesKafkaTopic =
  (typeof SalesKafkaTopics)[keyof typeof SalesKafkaTopics];
