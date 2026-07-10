export const kafkaConfig = {
  clientId: 'inventory-service',
  brokers: [(process.env.KAFKA_BROKER ?? 'localhost:9092')],
  groupId: 'inventory-service-group',
} as const;
