import { InventoryKafkaTopics } from '@is-kontrol/inventory-contracts';

export const kafkaConfig = {
  clientId: 'inventory-service',
  brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
  groupId: 'inventory-service',
};

export const inventoryTopics = InventoryKafkaTopics;
