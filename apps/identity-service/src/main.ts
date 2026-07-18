// dotenv, DB bağlantı URL'leri ve JWT anahtarları import anında okunduğu
// için her şeyden önce yüklenmeli.
import "dotenv/config";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { IdentityModule } from "./identity.module";
import { CorrelationContext } from "./infrastructure/correlation/correlation-context";
import { RequestActorContext } from "./infrastructure/auth/request-actor-context";

async function bootstrap() {
  const app = await NestFactory.create(IdentityModule);
  app.setGlobalPrefix("identity");
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

  // Şirket izolasyonu: x-company-id / x-user-id başlıkları aktör kapsamına
  // konur. Geçiş dönemi çözümüdür — libs/shared/auth guard'ları bağlandığında
  // kapsam JWT claim'lerinden dolacak.
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

  // Swagger UI: /identity/docs — request şemaları zod'dan üretilir.
  const openApiConfig = new DocumentBuilder()
    .setTitle("Identity Service API")
    .setDescription(
      "Tenant/Identity: firma (tenant), kullanıcı, rol/izin yönetimi ve " +
        "kimlik doğrulama (JWT). company.* ve user.* event'lerinin kaynağı.",
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
        description: "Kimliği doğrulanmış kullanıcı (davet eden vb. için).",
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
  SwaggerModule.setup("identity/docs", app, openApiDocument);

  // Bu servis event TÜKETMEZ (zincirin başı); Kafka yalnız producer olarak
  // kullanılır (outbox worker). connectMicroservice gerekmez.
  const port = process.env.PORT ?? 3004;
  await app.listen(port);
  Logger.log(`Identity service on http://localhost:${port}/identity`);
}

bootstrap();
