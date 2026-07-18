export const kafkaConfig = {
  clientId: 'identity-service',
  brokers: [(process.env.KAFKA_BROKER ?? 'localhost:9092')],
  groupId: 'identity-service-group',
} as const;
