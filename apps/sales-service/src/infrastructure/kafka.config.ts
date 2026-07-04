import { SalesKafkaTopics } from '@is-kontrol/sales-contracts';

export const kafkaConfig = {
  clientId: 'sales-service',
  brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
  groupId: 'sales-service',
};

export const salesTopics = SalesKafkaTopics;
