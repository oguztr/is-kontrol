import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { kafkaConfig } from './kafka.config';
import { KafkaProducerService, KAFKA_PRODUCER } from './kafka-producer.service';
import { SalesEventPublisher } from './sales-event.publisher';

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
  providers: [KafkaProducerService, SalesEventPublisher],
  exports: [KafkaProducerService, SalesEventPublisher],
})
export class KafkaModule {}
