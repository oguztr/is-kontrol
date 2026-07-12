import { Module } from "@nestjs/common";
import type { ClientKafka } from "@nestjs/microservices";
import { InventoryController } from "./inventory.controller";
import { InventoryHealthService } from "./inventory-health.service";
import { ProductsController } from "./interface/http/controllers/products.controller";
import { WarehousesController } from "./interface/http/controllers/warehouses.controller";
import { UnitsController } from "./interface/http/controllers/units.controller";
import { StockDocumentsController } from "./interface/http/controllers/stock-documents.controller";
import { StockMovementsController } from "./interface/http/controllers/stock-movements.controller";
import { StockBalancesController } from "./interface/http/controllers/stock-balances.controller";
import { KafkaModule, KAFKA_CLIENT } from "./infrastructure/messaging/kafka/kafka.module";
import { writeDb, DrizzleTransactionHost } from "./infrastructure/persistence/drizzle/drizzle.provider";
import { DrizzleUnitOfWork } from "./infrastructure/persistence/drizzle/unit-of-work";
import { DrizzleProductRepository } from "./infrastructure/persistence/drizzle/repositories/product.repository";
import { DrizzleWarehouseRepository } from "./infrastructure/persistence/drizzle/repositories/warehouse.repository";
import { DrizzleStockDocumentRepository } from "./infrastructure/persistence/drizzle/repositories/stock-document.repository";
import { DrizzleStockMovementRepository } from "./infrastructure/persistence/drizzle/repositories/stock-movement.repository";
import { DrizzleStockBalanceRepository } from "./infrastructure/persistence/drizzle/repositories/stock-balance.repository";
import { DrizzleOutboxRepository } from "./infrastructure/persistence/drizzle/repositories/outbox.repository";
import { DrizzleProcessedEventRepository } from "./infrastructure/persistence/drizzle/repositories/processed-event.repository";
import { DrizzleCompanyReferenceRepository } from "./infrastructure/persistence/drizzle/repositories/company-reference.repository";
import { DrizzleCurrencyReferenceRepository } from "./infrastructure/persistence/drizzle/repositories/currency-reference.repository";
import { DrizzleBusinessPartnerReferenceRepository } from "./infrastructure/persistence/drizzle/repositories/business-partner-reference.repository";
import { DrizzleProductDependencyRepository } from "./infrastructure/persistence/drizzle/repositories/product-dependency.repository";
import { KafkaEventPublisher } from "./infrastructure/messaging/kafka/kafka-event-publisher";
import { OutboxPublisherWorker } from "./infrastructure/messaging/kafka/outbox-publisher.worker";
import { MessagingWorkersLifecycle } from "./infrastructure/messaging/kafka/messaging-workers.lifecycle";
import { InventoryEventConsumer } from "./infrastructure/messaging/kafka/inventory-event.consumer";
import { ConsumedEventDispatcher } from "./application/event-handlers/consumed-event.dispatcher";
import type { IConsumedEventHandler } from "./application/event-handlers/consumed-event";
import { CreateProductHandler } from "./application/commands/products/create-product/create-product.handler";
import { CreateStockDocumentHandler } from "./application/commands/stock-documents/create-stock-document/create-stock-document.handler";
import { PostStockDocumentHandler } from "./application/commands/stock-documents/post-stock-document/post-stock-document.handler";
import { CompanyCreatedHandler } from "./application/event-handlers/company-created.handler";
import { CurrencyCreatedHandler } from "./application/event-handlers/currency-created.handler";
import { SupplierCreatedHandler } from "./application/event-handlers/supplier-created.handler";
import { CustomerCreatedHandler } from "./application/event-handlers/customer-created.handler";

/* Application katmanı framework'ten bağımsız (decorator'sız) sınıflardan
 * oluştuğu için tüm bağımlılık grafiği burada factory provider'larla elle
 * kurulur; @Inject yalnızca Kafka client token'ı için kullanılır (AGENTS.md). */

@Module({
  imports: [KafkaModule],
  controllers: [
    InventoryController,
    ProductsController,
    WarehousesController,
    UnitsController,
    StockDocumentsController,
    StockMovementsController,
    StockBalancesController,
    InventoryEventConsumer,
  ],
  providers: [
    {
      provide: InventoryHealthService,
      useFactory: (
        session: DrizzleTransactionHost,
        kafkaClient: ClientKafka,
      ) => new InventoryHealthService(session, kafkaClient),
      inject: [DrizzleTransactionHost, KAFKA_CLIENT],
    },
    // --- persistence çekirdeği ---
    {
      provide: DrizzleTransactionHost,
      useFactory: () => new DrizzleTransactionHost(writeDb),
    },
    {
      provide: DrizzleUnitOfWork,
      useFactory: (session: DrizzleTransactionHost) =>
        new DrizzleUnitOfWork(session),
      inject: [DrizzleTransactionHost],
    },

    // --- repository'ler ---
    {
      provide: DrizzleProductRepository,
      useFactory: (session: DrizzleTransactionHost) =>
        new DrizzleProductRepository(session),
      inject: [DrizzleTransactionHost],
    },
    {
      provide: DrizzleWarehouseRepository,
      useFactory: (session: DrizzleTransactionHost) =>
        new DrizzleWarehouseRepository(session),
      inject: [DrizzleTransactionHost],
    },
    {
      provide: DrizzleStockDocumentRepository,
      useFactory: (session: DrizzleTransactionHost) =>
        new DrizzleStockDocumentRepository(session),
      inject: [DrizzleTransactionHost],
    },
    {
      provide: DrizzleStockMovementRepository,
      useFactory: (session: DrizzleTransactionHost) =>
        new DrizzleStockMovementRepository(session),
      inject: [DrizzleTransactionHost],
    },
    {
      provide: DrizzleStockBalanceRepository,
      useFactory: (session: DrizzleTransactionHost) =>
        new DrizzleStockBalanceRepository(session),
      inject: [DrizzleTransactionHost],
    },
    {
      provide: DrizzleOutboxRepository,
      useFactory: (session: DrizzleTransactionHost) =>
        new DrizzleOutboxRepository(session),
      inject: [DrizzleTransactionHost],
    },
    {
      provide: DrizzleProcessedEventRepository,
      useFactory: (session: DrizzleTransactionHost) =>
        new DrizzleProcessedEventRepository(session),
      inject: [DrizzleTransactionHost],
    },
    {
      provide: DrizzleCompanyReferenceRepository,
      useFactory: (session: DrizzleTransactionHost) =>
        new DrizzleCompanyReferenceRepository(session),
      inject: [DrizzleTransactionHost],
    },
    {
      provide: DrizzleCurrencyReferenceRepository,
      useFactory: (session: DrizzleTransactionHost) =>
        new DrizzleCurrencyReferenceRepository(session),
      inject: [DrizzleTransactionHost],
    },
    {
      provide: DrizzleBusinessPartnerReferenceRepository,
      useFactory: (session: DrizzleTransactionHost) =>
        new DrizzleBusinessPartnerReferenceRepository(session),
      inject: [DrizzleTransactionHost],
    },
    {
      provide: DrizzleProductDependencyRepository,
      useFactory: (session: DrizzleTransactionHost) =>
        new DrizzleProductDependencyRepository(session),
      inject: [DrizzleTransactionHost],
    },

    // --- event publisher (transactional outbox'a yazar) ---
    {
      provide: KafkaEventPublisher,
      useFactory: (outboxRepository: DrizzleOutboxRepository) =>
        new KafkaEventPublisher(outboxRepository),
      inject: [DrizzleOutboxRepository],
    },

    // --- command handler'lar ---
    {
      provide: CreateProductHandler,
      useFactory: (
        productRepository: DrizzleProductRepository,
        companyReferenceRepository: DrizzleCompanyReferenceRepository,
        currencyReferenceRepository: DrizzleCurrencyReferenceRepository,
        productDependencyRepository: DrizzleProductDependencyRepository,
        eventPublisher: KafkaEventPublisher,
        unitOfWork: DrizzleUnitOfWork,
      ) =>
        new CreateProductHandler(
          productRepository,
          companyReferenceRepository,
          currencyReferenceRepository,
          productDependencyRepository,
          eventPublisher,
          unitOfWork,
        ),
      inject: [
        DrizzleProductRepository,
        DrizzleCompanyReferenceRepository,
        DrizzleCurrencyReferenceRepository,
        DrizzleProductDependencyRepository,
        KafkaEventPublisher,
        DrizzleUnitOfWork,
      ],
    },
    {
      provide: CreateStockDocumentHandler,
      useFactory: (
        stockDocumentRepository: DrizzleStockDocumentRepository,
        stockMovementRepository: DrizzleStockMovementRepository,
        productRepository: DrizzleProductRepository,
        warehouseRepository: DrizzleWarehouseRepository,
        companyReferenceRepository: DrizzleCompanyReferenceRepository,
        currencyReferenceRepository: DrizzleCurrencyReferenceRepository,
        businessPartnerReferenceRepository: DrizzleBusinessPartnerReferenceRepository,
        unitOfWork: DrizzleUnitOfWork,
      ) =>
        new CreateStockDocumentHandler(
          stockDocumentRepository,
          stockMovementRepository,
          productRepository,
          warehouseRepository,
          companyReferenceRepository,
          currencyReferenceRepository,
          businessPartnerReferenceRepository,
          unitOfWork,
        ),
      inject: [
        DrizzleStockDocumentRepository,
        DrizzleStockMovementRepository,
        DrizzleProductRepository,
        DrizzleWarehouseRepository,
        DrizzleCompanyReferenceRepository,
        DrizzleCurrencyReferenceRepository,
        DrizzleBusinessPartnerReferenceRepository,
        DrizzleUnitOfWork,
      ],
    },
    {
      provide: PostStockDocumentHandler,
      useFactory: (
        stockDocumentRepository: DrizzleStockDocumentRepository,
        stockMovementRepository: DrizzleStockMovementRepository,
        stockBalanceRepository: DrizzleStockBalanceRepository,
        eventPublisher: KafkaEventPublisher,
        unitOfWork: DrizzleUnitOfWork,
      ) =>
        new PostStockDocumentHandler(
          stockDocumentRepository,
          stockMovementRepository,
          stockBalanceRepository,
          eventPublisher,
          unitOfWork,
        ),
      inject: [
        DrizzleStockDocumentRepository,
        DrizzleStockMovementRepository,
        DrizzleStockBalanceRepository,
        KafkaEventPublisher,
        DrizzleUnitOfWork,
      ],
    },

    // --- tüketilen event handler'ları ---
    {
      provide: CompanyCreatedHandler,
      useFactory: (repository: DrizzleCompanyReferenceRepository) =>
        new CompanyCreatedHandler(repository),
      inject: [DrizzleCompanyReferenceRepository],
    },
    {
      provide: CurrencyCreatedHandler,
      useFactory: (repository: DrizzleCurrencyReferenceRepository) =>
        new CurrencyCreatedHandler(repository),
      inject: [DrizzleCurrencyReferenceRepository],
    },
    {
      provide: SupplierCreatedHandler,
      useFactory: (repository: DrizzleBusinessPartnerReferenceRepository) =>
        new SupplierCreatedHandler(repository),
      inject: [DrizzleBusinessPartnerReferenceRepository],
    },
    {
      provide: CustomerCreatedHandler,
      useFactory: (repository: DrizzleBusinessPartnerReferenceRepository) =>
        new CustomerCreatedHandler(repository),
      inject: [DrizzleBusinessPartnerReferenceRepository],
    },

    // --- arka plan worker'ları ---
    {
      provide: OutboxPublisherWorker,
      useFactory: (
        outboxRepository: DrizzleOutboxRepository,
        kafkaClient: ClientKafka,
        unitOfWork: DrizzleUnitOfWork,
      ) =>
        new OutboxPublisherWorker(
          outboxRepository,
          kafkaClient,
          unitOfWork,
          crypto.randomUUID(),
        ),
      inject: [DrizzleOutboxRepository, KAFKA_CLIENT, DrizzleUnitOfWork],
    },
    {
      provide: MessagingWorkersLifecycle,
      useFactory: (outboxPublisherWorker: OutboxPublisherWorker) =>
        new MessagingWorkersLifecycle(outboxPublisherWorker),
      inject: [OutboxPublisherWorker],
    },

    // --- idempotent consumer dispatcher'ı ---
    {
      provide: ConsumedEventDispatcher,
      useFactory: (
        unitOfWork: DrizzleUnitOfWork,
        processedEventRepository: DrizzleProcessedEventRepository,
        companyCreatedHandler: CompanyCreatedHandler,
        currencyCreatedHandler: CurrencyCreatedHandler,
        supplierCreatedHandler: SupplierCreatedHandler,
        customerCreatedHandler: CustomerCreatedHandler,
      ) =>
        new ConsumedEventDispatcher(
          unitOfWork,
          processedEventRepository,
          new Map<string, IConsumedEventHandler>([
            ["company.created", companyCreatedHandler],
            ["currency.created", currencyCreatedHandler],
            ["supplier.created", supplierCreatedHandler],
            ["customer.created", customerCreatedHandler],
          ]),
        ),
      inject: [
        DrizzleUnitOfWork,
        DrizzleProcessedEventRepository,
        CompanyCreatedHandler,
        CurrencyCreatedHandler,
        SupplierCreatedHandler,
        CustomerCreatedHandler,
      ],
    },
  ],
})
export class InventoryModule {}
