// dotenv, DB bağlantı URL'leri import anında okunduğu için her şeyden önce yüklenmeli.
import "dotenv/config";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Transport } from "@nestjs/microservices";
import type { MicroserviceOptions } from "@nestjs/microservices";
import { InventoryModule } from "./inventory.module";
import { kafkaConfig } from "./config/kafka.config";

async function bootstrap() {
  const app = await NestFactory.create(InventoryModule);
  app.setGlobalPrefix("inventory");
  app.enableShutdownHooks();

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: kafkaConfig.clientId,
        brokers: [...kafkaConfig.brokers],
      },
      consumer: { groupId: kafkaConfig.groupId },
    },
  });
  await app.startAllMicroservices();

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  Logger.log(`Inventory service on http://localhost:${port}/inventory`);
}

bootstrap();
