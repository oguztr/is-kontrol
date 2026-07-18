import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { kafkaConfig } from '../../../config/kafka.config';

export const KAFKA_CLIENT = 'KAFKA_CLIENT';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: KAFKA_CLIENT,
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: kafkaConfig.clientId,
            brokers: [...kafkaConfig.brokers],
          },
          producer: { allowAutoTopicCreation: false },
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class KafkaModule {}
