import { Module } from "@nestjs/common";
import type { InjectionToken, Provider } from "@nestjs/common";
import type { ClientKafka } from "@nestjs/microservices";
import { InventoryController } from "./inventory.controller";
import { InventoryHealthService } from "./inventory-health.service";
import { ProductsController } from "./interface/http/controllers/products.controller";
import { WarehousesController } from "./interface/http/controllers/warehouses.controller";
import { UnitsController } from "./interface/http/controllers/units.controller";
import { StockDocumentsController } from "./interface/http/controllers/stock-documents.controller";
import { StockMovementsController } from "./interface/http/controllers/stock-movements.controller";
import { StockBalancesController } from "./interface/http/controllers/stock-balances.controller";
import { ProductCategoriesController } from "./interface/http/controllers/product-categories.controller";
import { ProductUnitsController } from "./interface/http/controllers/product-units.controller";
import { ReportsController } from "./interface/http/controllers/reports.controller";
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
import { DrizzleUnitRepository } from "./infrastructure/persistence/drizzle/repositories/unit.repository";
import { DrizzleExchangeRateReferenceRepository } from "./infrastructure/persistence/drizzle/repositories/exchange-rate-reference.repository";
import { DrizzleProductCategoryRepository } from "./infrastructure/persistence/drizzle/repositories/product-category.repository";
import { DrizzleProductUnitRepository } from "./infrastructure/persistence/drizzle/repositories/product-unit.repository";
import { KafkaEventPublisher } from "./infrastructure/messaging/kafka/kafka-event-publisher";
import { CorrelationContext } from "./infrastructure/correlation/correlation-context";
import { RequestActorContext } from "./infrastructure/auth/request-actor-context";
import { OutboxPublisherWorker } from "./infrastructure/messaging/kafka/outbox-publisher.worker";
import { MessagingWorkersLifecycle } from "./infrastructure/messaging/kafka/messaging-workers.lifecycle";
import { InventoryEventConsumer } from "./infrastructure/messaging/kafka/inventory-event.consumer";
import { ConsumedEventDispatcher } from "./application/event-handlers/consumed-event.dispatcher";
import type { IConsumedEventHandler } from "./application/event-handlers/consumed-event";
import { CompanyCreatedHandler } from "./application/event-handlers/company-created.handler";
import { CurrencyCreatedHandler } from "./application/event-handlers/currency-created.handler";
import { SupplierCreatedHandler } from "./application/event-handlers/supplier-created.handler";
import { CustomerCreatedHandler } from "./application/event-handlers/customer-created.handler";
import { ExchangeRateUpdatedHandler } from "./application/event-handlers/exchange-rate-updated.handler";
import { BusinessPartnerSyncedHandler } from "./application/event-handlers/business-partner-synced.handler";
import {
  BusinessPartnerReferenceStatusChangedHandler,
  CompanyReferenceStatusChangedHandler,
  CurrencyReferenceStatusChangedHandler,
} from "./application/event-handlers/reference-status-changed.handler";
// --- command handler'ları ---
import { CreateUnitGroupHandler } from "./application/commands/units/create-unit-group/create-unit-group.handler";
import { UpdateUnitGroupHandler } from "./application/commands/units/update-unit-group/update-unit-group.handler";
import { DeleteUnitGroupHandler } from "./application/commands/units/delete-unit-group/delete-unit-group.handler";
import { CreateUnitHandler } from "./application/commands/units/create-unit/create-unit.handler";
import { UpdateUnitHandler } from "./application/commands/units/update-unit/update-unit.handler";
import { ActivateUnitHandler } from "./application/commands/units/activate-unit/activate-unit.handler";
import { DeactivateUnitHandler } from "./application/commands/units/deactivate-unit/deactivate-unit.handler";
import { SetBaseUnitHandler } from "./application/commands/units/set-base-unit/set-base-unit.handler";
import { SetConversionFactorHandler } from "./application/commands/units/set-conversion-factor/set-conversion-factor.handler";
import { CreateWarehouseHandler } from "./application/commands/warehouses/create-warehouse/create-warehouse.handler";
import { UpdateWarehouseHandler } from "./application/commands/warehouses/update-warehouse/update-warehouse.handler";
import { ActivateWarehouseHandler } from "./application/commands/warehouses/activate-warehouse/activate-warehouse.handler";
import { DeactivateWarehouseHandler } from "./application/commands/warehouses/deactivate-warehouse/deactivate-warehouse.handler";
import { DeleteWarehouseHandler } from "./application/commands/warehouses/delete-warehouse/delete-warehouse.handler";
import { CreateProductCategoryHandler } from "./application/commands/product-categories/create-product-category/create-product-category.handler";
import { UpdateProductCategoryHandler } from "./application/commands/product-categories/update-product-category/update-product-category.handler";
import { DeleteProductCategoryHandler } from "./application/commands/product-categories/delete-product-category/delete-product-category.handler";
import { CreateProductHandler } from "./application/commands/products/create-product/create-product.handler";
import { UpdateProductHandler } from "./application/commands/products/update-product/update-product.handler";
import { ActivateProductHandler } from "./application/commands/products/activate-product/activate-product.handler";
import { DeactivateProductHandler } from "./application/commands/products/deactivate-product/deactivate-product.handler";
import { ArchiveProductHandler } from "./application/commands/products/archive-product/archive-product.handler";
import { DeleteProductHandler } from "./application/commands/products/delete-product/delete-product.handler";
import { ChangeProductBaseUnitHandler } from "./application/commands/products/change-product-base-unit/change-product-base-unit.handler";
import { SetProductStockLevelsHandler } from "./application/commands/products/set-product-stock-levels/set-product-stock-levels.handler";
import { AddProductUnitHandler } from "./application/commands/product-units/add-product-unit/add-product-unit.handler";
import { UpdateProductUnitHandler } from "./application/commands/product-units/update-product-unit/update-product-unit.handler";
import { RemoveProductUnitHandler } from "./application/commands/product-units/remove-product-unit/remove-product-unit.handler";
import { CreateStockDocumentHandler } from "./application/commands/stock-documents/create-stock-document/create-stock-document.handler";
import { PostStockDocumentHandler } from "./application/commands/stock-documents/post-stock-document/post-stock-document.handler";
import { UpdateStockDocumentHandler } from "./application/commands/stock-documents/update-stock-document/update-stock-document.handler";
import { DeleteStockDocumentHandler } from "./application/commands/stock-documents/delete-stock-document/delete-stock-document.handler";
import { AddStockDocumentLineHandler } from "./application/commands/stock-documents/add-stock-document-line/add-stock-document-line.handler";
import { UpdateStockDocumentLineHandler } from "./application/commands/stock-documents/update-stock-document-line/update-stock-document-line.handler";
import { RemoveStockDocumentLineHandler } from "./application/commands/stock-documents/remove-stock-document-line/remove-stock-document-line.handler";
import { CancelStockDocumentHandler } from "./application/commands/stock-documents/cancel-stock-document/cancel-stock-document.handler";
import { StockDocumentLineBuilder } from "./application/commands/stock-documents/stock-document-line.builder";
import { StockDocumentPostValidator } from "./application/commands/stock-documents/stock-document-post.validator";
import { StockBalanceEventsPublisher } from "./application/commands/stock-documents/stock-balance-events.publisher";
// --- query handler'ları ---
import { GetUnitGroupHandler } from "./application/queries/units/get-unit-group/get-unit-group.handler";
import { ListUnitGroupsHandler } from "./application/queries/units/list-unit-groups/list-unit-groups.handler";
import { GetUnitHandler } from "./application/queries/units/get-unit/get-unit.handler";
import { ListUnitsHandler } from "./application/queries/units/list-units/list-units.handler";
import { GetWarehouseHandler } from "./application/queries/warehouses/get-warehouse/get-warehouse.handler";
import { ListWarehousesHandler } from "./application/queries/warehouses/list-warehouses/list-warehouses.handler";
import { GetProductCategoryHandler } from "./application/queries/product-categories/get-product-category/get-product-category.handler";
import { GetCategoryTreeHandler } from "./application/queries/product-categories/get-category-tree/get-category-tree.handler";
import { GetProductHandler } from "./application/queries/products/get-product/get-product.handler";
import { ListProductsHandler } from "./application/queries/products/list-products/list-products.handler";
import { SearchProductsHandler } from "./application/queries/products/search-products/search-products.handler";
import { GetProductBySkuHandler } from "./application/queries/products/get-product-by-sku/get-product-by-sku.handler";
import { GetProductByBarcodeHandler } from "./application/queries/products/get-product-by-barcode/get-product-by-barcode.handler";
import { ListProductUnitsHandler } from "./application/queries/product-units/list-product-units/list-product-units.handler";
import { GetStockDocumentHandler } from "./application/queries/stock-documents/get-stock-document/get-stock-document.handler";
import { GetStockDocumentByNumberHandler } from "./application/queries/stock-documents/get-stock-document-by-number/get-stock-document-by-number.handler";
import { ListStockDocumentsHandler } from "./application/queries/stock-documents/list-stock-documents/list-stock-documents.handler";
import { GetStockMovementHandler } from "./application/queries/stock-movements/get-stock-movement/get-stock-movement.handler";
import { ListStockMovementsHandler } from "./application/queries/stock-movements/list-stock-movements/list-stock-movements.handler";
import { GetDocumentMovementsHandler } from "./application/queries/stock-movements/get-document-movements/get-document-movements.handler";
import { GetProductMovementHistoryHandler } from "./application/queries/stock-movements/get-product-movement-history/get-product-movement-history.handler";
import { GetWarehouseMovementHistoryHandler } from "./application/queries/stock-movements/get-warehouse-movement-history/get-warehouse-movement-history.handler";
import { GetStockBalanceHandler } from "./application/queries/stock-balances/get-stock-balance/get-stock-balance.handler";
import { GetProductStockHandler } from "./application/queries/stock-balances/get-product-stock/get-product-stock.handler";
import { GetWarehouseStockHandler } from "./application/queries/stock-balances/get-warehouse-stock/get-warehouse-stock.handler";
import { GetInventorySummaryHandler } from "./application/queries/stock-balances/get-inventory-summary/get-inventory-summary.handler";
import { GetLowStockProductsHandler } from "./application/queries/stock-balances/get-low-stock-products/get-low-stock-products.handler";
import { GetOverstockProductsHandler } from "./application/queries/stock-balances/get-overstock-products/get-overstock-products.handler";
import { GetOutOfStockProductsHandler } from "./application/queries/stock-balances/get-out-of-stock-products/get-out-of-stock-products.handler";
import { GetNegativeStockProductsHandler } from "./application/queries/stock-balances/get-negative-stock-products/get-negative-stock-products.handler";
import { GetInventoryValuationHandler } from "./application/queries/reports/get-inventory-valuation/get-inventory-valuation.handler";
import { GetStockCardHandler } from "./application/queries/reports/get-stock-card/get-stock-card.handler";
import { GetInventoryDashboardHandler } from "./application/queries/reports/get-inventory-dashboard/get-inventory-dashboard.handler";

/* Application katmanı framework'ten bağımsız (decorator'sız) sınıflardan
 * oluştuğu için tüm bağımlılık grafiği burada factory provider'larla kurulur;
 * @Inject yalnızca Kafka client token'ı için kullanılır (AGENTS.md).
 * handlerProvider, "inject sırası = constructor parametre sırası" sözleşmesiyle
 * command/query handler'larının tekrarlı factory tanımlarını üretir. */

type HandlerConstructor<T> = new (...args: never[]) => T;

const handlerProvider = <T>(
  token: HandlerConstructor<T>,
  inject: InjectionToken[],
): Provider => ({
  provide: token,
  useFactory: (...deps: never[]) => new token(...deps),
  inject,
});

const UNIT_COMMAND_DEPS = [DrizzleUnitRepository, DrizzleUnitOfWork, RequestActorContext];
const WAREHOUSE_CHANGE_DEPS = [
  DrizzleWarehouseRepository, KafkaEventPublisher, DrizzleUnitOfWork, RequestActorContext];
const CATEGORY_COMMAND_DEPS = [
  DrizzleProductCategoryRepository, DrizzleUnitOfWork, RequestActorContext];
const PRODUCT_MUTATION_DEPS = [
  DrizzleProductRepository, DrizzleProductDependencyRepository,
  KafkaEventPublisher, DrizzleUnitOfWork, RequestActorContext];
const DOCUMENT_DRAFT_DEPS = [
  DrizzleStockDocumentRepository, DrizzleStockMovementRepository,
  StockDocumentLineBuilder, DrizzleUnitOfWork, RequestActorContext];

@Module({
  imports: [KafkaModule],
  controllers: [
    InventoryController,
    ProductsController,
    ProductCategoriesController,
    ProductUnitsController,
    WarehousesController,
    UnitsController,
    StockDocumentsController,
    StockMovementsController,
    StockBalancesController,
    ReportsController,
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
    handlerProvider(DrizzleUnitOfWork, [DrizzleTransactionHost]),

    // --- repository'ler ---
    handlerProvider(DrizzleProductRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleWarehouseRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleStockDocumentRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleStockMovementRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleStockBalanceRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleOutboxRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleProcessedEventRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleCompanyReferenceRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleCurrencyReferenceRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleBusinessPartnerReferenceRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleProductDependencyRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleUnitRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleExchangeRateReferenceRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleProductCategoryRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleProductUnitRepository, [DrizzleTransactionHost]),

    // --- aktör kapsamı (şirket izolasyonu + createdBy) ---
    { provide: RequestActorContext, useFactory: () => new RequestActorContext() },

    // --- correlation bağlamı (HTTP middleware + consumer + outbox) ---
    { provide: CorrelationContext, useFactory: () => new CorrelationContext() },

    // --- event publisher (transactional outbox'a yazar) ---
    handlerProvider(KafkaEventPublisher, [DrizzleOutboxRepository, CorrelationContext]),

    // --- ortak command yardımcıları ---
    handlerProvider(StockDocumentLineBuilder, [
      DrizzleProductRepository, DrizzleProductUnitRepository]),
    handlerProvider(StockBalanceEventsPublisher, [
      DrizzleProductRepository, KafkaEventPublisher]),
    handlerProvider(StockDocumentPostValidator, [
      DrizzleCompanyReferenceRepository,
      DrizzleCurrencyReferenceRepository,
      DrizzleWarehouseRepository,
      DrizzleBusinessPartnerReferenceRepository,
      DrizzleProductRepository,
      DrizzleProductUnitRepository,
    ]),

    // --- unit command/query'leri ---
    handlerProvider(CreateUnitGroupHandler, [
      DrizzleUnitRepository, DrizzleCompanyReferenceRepository,
      DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(UpdateUnitGroupHandler, UNIT_COMMAND_DEPS),
    handlerProvider(DeleteUnitGroupHandler, UNIT_COMMAND_DEPS),
    handlerProvider(CreateUnitHandler, [
      DrizzleUnitRepository, DrizzleCompanyReferenceRepository,
      DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(UpdateUnitHandler, UNIT_COMMAND_DEPS),
    handlerProvider(ActivateUnitHandler, UNIT_COMMAND_DEPS),
    handlerProvider(DeactivateUnitHandler, UNIT_COMMAND_DEPS),
    handlerProvider(SetBaseUnitHandler, UNIT_COMMAND_DEPS),
    handlerProvider(SetConversionFactorHandler, UNIT_COMMAND_DEPS),
    handlerProvider(GetUnitGroupHandler, [DrizzleUnitRepository, RequestActorContext]),
    handlerProvider(ListUnitGroupsHandler, [
      DrizzleUnitRepository, DrizzleCompanyReferenceRepository, RequestActorContext]),
    handlerProvider(GetUnitHandler, [DrizzleUnitRepository, RequestActorContext]),
    handlerProvider(ListUnitsHandler, [
      DrizzleUnitRepository, DrizzleCompanyReferenceRepository, RequestActorContext]),

    // --- warehouse command/query'leri ---
    handlerProvider(CreateWarehouseHandler, [
      DrizzleWarehouseRepository, DrizzleCompanyReferenceRepository,
      KafkaEventPublisher, DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(UpdateWarehouseHandler, WAREHOUSE_CHANGE_DEPS),
    handlerProvider(ActivateWarehouseHandler, WAREHOUSE_CHANGE_DEPS),
    handlerProvider(DeactivateWarehouseHandler, WAREHOUSE_CHANGE_DEPS),
    handlerProvider(DeleteWarehouseHandler, [
      DrizzleWarehouseRepository, DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(GetWarehouseHandler, [DrizzleWarehouseRepository, RequestActorContext]),
    handlerProvider(ListWarehousesHandler, [
      DrizzleWarehouseRepository, DrizzleCompanyReferenceRepository, RequestActorContext]),

    // --- kategori command/query'leri ---
    handlerProvider(CreateProductCategoryHandler, [
      DrizzleProductCategoryRepository, DrizzleCompanyReferenceRepository,
      DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(UpdateProductCategoryHandler, CATEGORY_COMMAND_DEPS),
    handlerProvider(DeleteProductCategoryHandler, CATEGORY_COMMAND_DEPS),
    handlerProvider(GetProductCategoryHandler, [
      DrizzleProductCategoryRepository, RequestActorContext]),
    handlerProvider(GetCategoryTreeHandler, [
      DrizzleProductCategoryRepository, DrizzleCompanyReferenceRepository, RequestActorContext]),

    // --- ürün command/query'leri ---
    handlerProvider(CreateProductHandler, [
      DrizzleProductRepository,
      DrizzleProductUnitRepository,
      DrizzleCompanyReferenceRepository,
      DrizzleCurrencyReferenceRepository,
      DrizzleProductDependencyRepository,
      KafkaEventPublisher,
      DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(UpdateProductHandler, [
      DrizzleProductRepository, DrizzleProductDependencyRepository,
      DrizzleCurrencyReferenceRepository,
      KafkaEventPublisher, DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(ActivateProductHandler, PRODUCT_MUTATION_DEPS),
    handlerProvider(DeactivateProductHandler, PRODUCT_MUTATION_DEPS),
    handlerProvider(ArchiveProductHandler, PRODUCT_MUTATION_DEPS),
    handlerProvider(DeleteProductHandler, PRODUCT_MUTATION_DEPS),
    handlerProvider(ChangeProductBaseUnitHandler, [
      DrizzleProductRepository, DrizzleProductDependencyRepository,
      DrizzleProductUnitRepository,
      KafkaEventPublisher, DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(SetProductStockLevelsHandler, PRODUCT_MUTATION_DEPS),
    handlerProvider(GetProductHandler, [DrizzleProductRepository, RequestActorContext]),
    handlerProvider(ListProductsHandler, [
      DrizzleProductRepository, DrizzleProductDependencyRepository,
      DrizzleCompanyReferenceRepository, RequestActorContext]),
    handlerProvider(SearchProductsHandler, [
      DrizzleProductRepository, DrizzleCompanyReferenceRepository, RequestActorContext]),
    handlerProvider(GetProductBySkuHandler, [DrizzleProductRepository, RequestActorContext]),
    handlerProvider(GetProductByBarcodeHandler, [DrizzleProductRepository, RequestActorContext]),

    // --- ürün birimi command/query'leri ---
    handlerProvider(AddProductUnitHandler, [
      DrizzleProductRepository, DrizzleProductDependencyRepository,
      DrizzleProductUnitRepository, DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(UpdateProductUnitHandler, [
      DrizzleProductRepository, DrizzleProductUnitRepository,
      DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(RemoveProductUnitHandler, [
      DrizzleProductRepository, DrizzleProductUnitRepository,
      DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(ListProductUnitsHandler, [
      DrizzleProductRepository, DrizzleProductUnitRepository, RequestActorContext]),

    // --- stok belgesi command/query'leri ---
    handlerProvider(CreateStockDocumentHandler, [
      DrizzleStockDocumentRepository,
      DrizzleStockMovementRepository,
      StockDocumentLineBuilder,
      DrizzleWarehouseRepository,
      DrizzleCompanyReferenceRepository,
      DrizzleCurrencyReferenceRepository,
      DrizzleBusinessPartnerReferenceRepository,
      KafkaEventPublisher,
      DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(PostStockDocumentHandler, [
      DrizzleStockDocumentRepository,
      DrizzleStockMovementRepository,
      DrizzleStockBalanceRepository,
      StockDocumentPostValidator,
      StockBalanceEventsPublisher,
      KafkaEventPublisher,
      DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(UpdateStockDocumentHandler, [
      DrizzleStockDocumentRepository, DrizzleStockMovementRepository,
      DrizzleBusinessPartnerReferenceRepository,
      StockDocumentLineBuilder, DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(DeleteStockDocumentHandler, DOCUMENT_DRAFT_DEPS),
    handlerProvider(AddStockDocumentLineHandler, DOCUMENT_DRAFT_DEPS),
    handlerProvider(UpdateStockDocumentLineHandler, DOCUMENT_DRAFT_DEPS),
    handlerProvider(RemoveStockDocumentLineHandler, DOCUMENT_DRAFT_DEPS),
    handlerProvider(CancelStockDocumentHandler, [
      DrizzleStockDocumentRepository, DrizzleStockMovementRepository,
      DrizzleStockBalanceRepository, StockBalanceEventsPublisher,
      KafkaEventPublisher, DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(GetStockDocumentHandler, [
      DrizzleStockDocumentRepository, DrizzleStockMovementRepository, RequestActorContext]),
    handlerProvider(GetStockDocumentByNumberHandler, [
      DrizzleStockDocumentRepository, RequestActorContext]),
    handlerProvider(ListStockDocumentsHandler, [
      DrizzleStockDocumentRepository, DrizzleCompanyReferenceRepository, RequestActorContext]),

    // --- stok hareketi query'leri ---
    handlerProvider(GetStockMovementHandler, [
      DrizzleStockMovementRepository, RequestActorContext]),
    handlerProvider(ListStockMovementsHandler, [
      DrizzleStockMovementRepository, DrizzleCompanyReferenceRepository, RequestActorContext]),
    handlerProvider(GetDocumentMovementsHandler, [
      DrizzleStockMovementRepository, DrizzleStockDocumentRepository, RequestActorContext]),
    handlerProvider(GetProductMovementHistoryHandler, [
      DrizzleStockMovementRepository, DrizzleProductRepository, RequestActorContext]),
    handlerProvider(GetWarehouseMovementHistoryHandler, [
      DrizzleStockMovementRepository, DrizzleWarehouseRepository, RequestActorContext]),

    // --- stok bakiyesi query'leri ---
    handlerProvider(GetStockBalanceHandler, [
      DrizzleStockBalanceRepository, DrizzleProductRepository,
      DrizzleWarehouseRepository, RequestActorContext]),
    handlerProvider(GetProductStockHandler, [
      DrizzleStockBalanceRepository, DrizzleProductRepository, RequestActorContext]),
    handlerProvider(GetWarehouseStockHandler, [
      DrizzleStockBalanceRepository, DrizzleWarehouseRepository, RequestActorContext]),
    handlerProvider(GetInventorySummaryHandler, [
      DrizzleStockBalanceRepository, DrizzleCompanyReferenceRepository, RequestActorContext]),
    handlerProvider(GetLowStockProductsHandler, [
      DrizzleStockBalanceRepository, DrizzleCompanyReferenceRepository, RequestActorContext]),
    handlerProvider(GetOverstockProductsHandler, [
      DrizzleStockBalanceRepository, DrizzleCompanyReferenceRepository, RequestActorContext]),
    handlerProvider(GetOutOfStockProductsHandler, [
      DrizzleStockBalanceRepository, DrizzleCompanyReferenceRepository, RequestActorContext]),
    handlerProvider(GetNegativeStockProductsHandler, [
      DrizzleStockBalanceRepository, DrizzleCompanyReferenceRepository, RequestActorContext]),

    // --- rapor query'leri ---
    handlerProvider(GetInventoryValuationHandler, [
      DrizzleStockBalanceRepository, DrizzleWarehouseRepository,
      DrizzleCompanyReferenceRepository, RequestActorContext]),
    handlerProvider(GetStockCardHandler, [
      DrizzleStockMovementRepository, DrizzleProductRepository,
      DrizzleWarehouseRepository, RequestActorContext]),
    handlerProvider(GetInventoryDashboardHandler, [
      DrizzleStockBalanceRepository, DrizzleStockMovementRepository,
      DrizzleCompanyReferenceRepository, RequestActorContext]),

    // --- tüketilen event handler'ları ---
    handlerProvider(CompanyCreatedHandler, [DrizzleCompanyReferenceRepository]),
    handlerProvider(CurrencyCreatedHandler, [DrizzleCurrencyReferenceRepository]),
    handlerProvider(SupplierCreatedHandler, [DrizzleBusinessPartnerReferenceRepository]),
    handlerProvider(CustomerCreatedHandler, [DrizzleBusinessPartnerReferenceRepository]),
    handlerProvider(ExchangeRateUpdatedHandler, [DrizzleExchangeRateReferenceRepository]),
    handlerProvider(BusinessPartnerSyncedHandler, [DrizzleBusinessPartnerReferenceRepository]),
    handlerProvider(CompanyReferenceStatusChangedHandler, [DrizzleCompanyReferenceRepository]),
    handlerProvider(CurrencyReferenceStatusChangedHandler, [DrizzleCurrencyReferenceRepository]),
    handlerProvider(BusinessPartnerReferenceStatusChangedHandler, [DrizzleBusinessPartnerReferenceRepository]),

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
    handlerProvider(MessagingWorkersLifecycle, [OutboxPublisherWorker]),

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
        exchangeRateUpdatedHandler: ExchangeRateUpdatedHandler,
        businessPartnerSyncedHandler: BusinessPartnerSyncedHandler,
        companyStatusHandler: CompanyReferenceStatusChangedHandler,
        currencyStatusHandler: CurrencyReferenceStatusChangedHandler,
        partnerStatusHandler: BusinessPartnerReferenceStatusChangedHandler,
      ) =>
        new ConsumedEventDispatcher(
          unitOfWork,
          processedEventRepository,
          new Map<string, IConsumedEventHandler>([
            ["company.created", companyCreatedHandler],
            ["company.updated", companyCreatedHandler],
            ["company.activated", companyStatusHandler],
            ["company.deactivated", companyStatusHandler],
            ["currency.created", currencyCreatedHandler],
            ["currency.updated", currencyCreatedHandler],
            ["currency.activated", currencyStatusHandler],
            ["currency.deactivated", currencyStatusHandler],
            ["exchange-rate.updated", exchangeRateUpdatedHandler],
            ["supplier.created", supplierCreatedHandler],
            ["supplier.updated", supplierCreatedHandler],
            ["supplier.activated", partnerStatusHandler],
            ["supplier.deactivated", partnerStatusHandler],
            ["customer.created", customerCreatedHandler],
            ["customer.updated", customerCreatedHandler],
            ["customer.activated", partnerStatusHandler],
            ["customer.deactivated", partnerStatusHandler],
            ["business-partner.created", businessPartnerSyncedHandler],
            ["business-partner.updated", businessPartnerSyncedHandler],
            ["business-partner.activated", partnerStatusHandler],
            ["business-partner.deactivated", partnerStatusHandler],
          ]),
        ),
      inject: [
        DrizzleUnitOfWork,
        DrizzleProcessedEventRepository,
        CompanyCreatedHandler,
        CurrencyCreatedHandler,
        SupplierCreatedHandler,
        CustomerCreatedHandler,
        ExchangeRateUpdatedHandler,
        BusinessPartnerSyncedHandler,
        CompanyReferenceStatusChangedHandler,
        CurrencyReferenceStatusChangedHandler,
        BusinessPartnerReferenceStatusChangedHandler,
      ],
    },
  ],
})
export class InventoryModule {}
