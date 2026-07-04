import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { kafkaConfig } from './kafka.config';
import { KafkaProducerService, KAFKA_PRODUCER } from './kafka-producer.service';
import { InventoryEventPublisher } from './inventory-event.publisher';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: KAFKA_PRODUCER,
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: `${kafkaConfig.clientId}-producer`,
            brokers: kafkaConfig.brokers,
          },
          producerOnlyMode: true,
        },
      },
    ]),
  ],
  providers: [KafkaProducerService, InventoryEventPublisher],
  exports: [KafkaProducerService, InventoryEventPublisher],
})
export class KafkaModule {}
