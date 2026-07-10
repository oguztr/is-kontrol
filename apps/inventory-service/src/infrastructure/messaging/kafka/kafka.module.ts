import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

export const KAFKA_CLIENT = 'KAFKA_CLIENT';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: KAFKA_CLIENT,
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'inventory-service',
            brokers: [(process.env.KAFKA_BROKER ?? 'localhost:9092')],
          },
          producer: { allowAutoTopicCreation: false },
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class KafkaModule {}
