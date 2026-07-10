import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { InventoryModule } from "./inventory.module";

async function bootstrap() {
  const app = await NestFactory.create(InventoryModule);
  app.setGlobalPrefix("inventory");

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  Logger.log(`Inventory service on http://localhost:${port}/inventory`);
}

bootstrap();
