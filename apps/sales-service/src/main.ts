import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SalesModule } from './sales.module';

async function bootstrap() {
  const app = await NestFactory.create(SalesModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: { brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'] },
      consumer: { groupId: 'sales-service' },
    },
  });

  app.setGlobalPrefix('sales');
  const port = process.env.PORT || 3002;
  await app.startAllMicroservices();
  await app.listen(port);
  Logger.log(`Sales service on http://localhost:${port}/sales`);
}

bootstrap();
