export const kafkaConfig = {
  clientId: 'customer-service',
  brokers: [(process.env.KAFKA_BROKER ?? 'localhost:9092')],
  groupId: 'customer-service-group',
} as const;
