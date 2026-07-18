// dotenv, DB bağlantı URL'leri import anında okunduğu için her şeyden önce yüklenmeli.
import "dotenv/config";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Transport } from "@nestjs/microservices";
import type { MicroserviceOptions } from "@nestjs/microservices";
import { CustomerModule } from "./customer.module";
import { kafkaConfig } from "./config/kafka.config";
import { CorrelationContext } from "./infrastructure/correlation/correlation-context";
import { RequestActorContext } from "./infrastructure/auth/request-actor-context";

async function bootstrap() {
  const app = await NestFactory.create(CustomerModule);
  app.setGlobalPrefix("customers");
  app.enableShutdownHooks();

  // Gelen x-correlation-id (yoksa üretilen UUID) istek bağlamına konur;
  // outbox'a yazılan tüm eventler ve yanıt başlığı bu ID'yi taşır.
  const correlation = app.get(CorrelationContext);
  app.use(
    (
      req: { headers: Record<string, string | string[] | undefined> },
      res: { setHeader: (name: string, value: string) => void },
      next: () => void,
    ) => {
      const incoming = req.headers["x-correlation-id"];
      const correlationId =
        (Array.isArray(incoming) ? incoming[0] : incoming) ??
        crypto.randomUUID();
      res.setHeader("x-correlation-id", correlationId);
      correlation.run(correlationId, next);
    },
  );

  // Şirket izolasyonu: gateway/BFF'in doğruladığı x-company-id / x-user-id
  // başlıkları aktör kapsamına konur; use case'ler kapsam dışı veriye erişimi
  // notFound olarak reddeder. Başlıksız çağrılar kısıtlanmaz (iç trafik).
  const actor = app.get(RequestActorContext);
  app.use(
    (
      req: { headers: Record<string, string | string[] | undefined> },
      _res: unknown,
      next: () => void,
    ) => {
      const header = (name: string): string | null => {
        const value = req.headers[name];
        return (Array.isArray(value) ? value[0] : value) ?? null;
      };
      actor.run(
        { companyId: header("x-company-id"), userId: header("x-user-id") },
        next,
      );
    },
  );

  // Swagger UI: /customers/docs — request şemaları zod'dan üretilir.
  const openApiConfig = new DocumentBuilder()
    .setTitle("Customer Service API")
    .setDescription(
      "Mini CRM: partnerler (müşteri/tedarikçi), firma bilgileri, kişiler, adresler ve notlar.",
    )
    .setVersion("0.0.1")
    .addGlobalParameters(
      {
        name: "x-company-id",
        in: "header",
        required: false,
        description: "Aktörün şirketi; verilirse veri izolasyonu uygulanır.",
        schema: { type: "string", format: "uuid" },
      },
      {
        name: "x-user-id",
        in: "header",
        required: false,
        description: "Kimliği doğrulanmış kullanıcı (createdBy/yazar için).",
        schema: { type: "string", format: "uuid" },
      },
      {
        name: "x-correlation-id",
        in: "header",
        required: false,
        description: "Uçtan uca izleme ID'si; verilmezse üretilir.",
        schema: { type: "string" },
      },
    )
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup("customers/docs", app, openApiDocument);

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

  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  Logger.log(`Customer service on http://localhost:${port}/customers`);
}

bootstrap();
