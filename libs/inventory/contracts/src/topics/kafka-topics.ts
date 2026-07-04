/** Product / Stock Kafka topic names */
export const InventoryKafkaTopics = {
  STOCK_CREATED: 'stock.created',
  STOCK_MOVED: 'stock.moved',
  STOCK_RESERVED: 'stock.reserved',
  STOCK_RELEASED: 'stock.released',
  PRODUCT_CREATED: 'product.created',
} as const;

export type InventoryKafkaTopic =
  (typeof InventoryKafkaTopics)[keyof typeof InventoryKafkaTopics];
