import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { InventoryModule } from './inventory.module';
import { kafkaConfig } from './infrastructure/kafka.config';

async function bootstrap() {
  const app = await NestFactory.create(InventoryModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: kafkaConfig.clientId,
        brokers: kafkaConfig.brokers,
      },
      consumer: { groupId: kafkaConfig.groupId },
    },
  });

  app.setGlobalPrefix('inventory');
  const port = process.env.PORT || 3001;
  await app.startAllMicroservices();
  await app.listen(port);
  Logger.log(`Inventory service on http://localhost:${port}/inventory`);
}

bootstrap();
