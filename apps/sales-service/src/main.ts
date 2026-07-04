import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SalesModule } from './sales.module';
import { kafkaConfig } from './infrastructure/kafka.config';

async function bootstrap() {
  const app = await NestFactory.create(SalesModule);
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

  app.setGlobalPrefix('sales');
  const port = process.env.PORT || 3002;
  await app.startAllMicroservices();
  await app.listen(port);
  Logger.log(`Sales service on http://localhost:${port}/sales`);
}

bootstrap();
