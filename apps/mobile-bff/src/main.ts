import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MobileBffModule } from './mobile-bff.module';

async function bootstrap() {
  const app = await NestFactory.create(MobileBffModule);
  app.setGlobalPrefix('bff');
  const port = process.env.PORT || 4000;
  await app.listen(port);
  Logger.log(`Mobile BFF running on http://localhost:${port}/bff`);
}

bootstrap();
