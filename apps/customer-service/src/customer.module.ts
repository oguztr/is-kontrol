import { Module } from "@nestjs/common";
import type { InjectionToken, Provider } from "@nestjs/common";
import type { ClientKafka } from "@nestjs/microservices";
import { CustomerController } from "./customer.controller";
import { CustomerHealthService } from "./customer-health.service";
import { PartnersController } from "./interface/http/controllers/partners.controller";
import { PartnerContactsController } from "./interface/http/controllers/partner-contacts.controller";
import { PartnerAddressesController } from "./interface/http/controllers/partner-addresses.controller";
import { PartnerNotesController } from "./interface/http/controllers/partner-notes.controller";
import { KafkaModule, KAFKA_CLIENT } from "./infrastructure/messaging/kafka/kafka.module";
import { writeDb, DrizzleTransactionHost } from "./infrastructure/persistence/drizzle/drizzle.provider";
import { DrizzleUnitOfWork } from "./infrastructure/persistence/drizzle/unit-of-work";
import { DrizzlePartnerRepository } from "./infrastructure/persistence/drizzle/repositories/partner.repository";
import { DrizzleCompanyProfileRepository } from "./infrastructure/persistence/drizzle/repositories/company-profile.repository";
import { DrizzleContactRepository } from "./infrastructure/persistence/drizzle/repositories/contact.repository";
import { DrizzleAddressRepository } from "./infrastructure/persistence/drizzle/repositories/address.repository";
import { DrizzleNoteRepository } from "./infrastructure/persistence/drizzle/repositories/note.repository";
import { DrizzlePartnerActivityRepository } from "./infrastructure/persistence/drizzle/repositories/partner-activity.repository";
import { DrizzleCompanyReferenceRepository } from "./infrastructure/persistence/drizzle/repositories/company-reference.repository";
import { DrizzleProductReferenceRepository } from "./infrastructure/persistence/drizzle/repositories/product-reference.repository";
import { DrizzleOutboxRepository } from "./infrastructure/persistence/drizzle/repositories/outbox.repository";
import { DrizzleProcessedEventRepository } from "./infrastructure/persistence/drizzle/repositories/processed-event.repository";
import { KafkaEventPublisher } from "./infrastructure/messaging/kafka/kafka-event-publisher";
import { CorrelationContext } from "./infrastructure/correlation/correlation-context";
import { RequestActorContext } from "./infrastructure/auth/request-actor-context";
import { OutboxPublisherWorker } from "./infrastructure/messaging/kafka/outbox-publisher.worker";
import { OutboxWakeupListener } from "./infrastructure/messaging/kafka/outbox-wakeup.listener";
import { MessagingWorkersLifecycle } from "./infrastructure/messaging/kafka/messaging-workers.lifecycle";
import { CustomerEventConsumer } from "./infrastructure/messaging/kafka/customer-event.consumer";
import { ConsumedEventDispatcher } from "./application/event-handlers/consumed-event.dispatcher";
import type { IConsumedEventHandler } from "./application/event-handlers/consumed-event";
import { CompanyCreatedHandler } from "./application/event-handlers/company-created.handler";
import { CompanyStatusChangedHandler } from "./application/event-handlers/company-status-changed.handler";
import { ProductCreatedHandler } from "./application/event-handlers/product-created.handler";
import { ProductStatusChangedHandler } from "./application/event-handlers/product-status-changed.handler";
// --- command handler'ları ---
import { CreatePartnerHandler } from "./application/commands/partners/create-partner/create-partner.handler";
import { UpdatePartnerHandler } from "./application/commands/partners/update-partner/update-partner.handler";
import { ExpandPartnerTypeHandler } from "./application/commands/partners/expand-partner-type/expand-partner-type.handler";
import { ChangePartnerStatusHandler } from "./application/commands/partners/change-partner-status/change-partner-status.handler";
import { UpdateSalesFunnelStageHandler } from "./application/commands/partners/update-sales-funnel-stage/update-sales-funnel-stage.handler";
import { AssignPartnerHandler } from "./application/commands/partners/assign-partner/assign-partner.handler";
import { AddPartnerTagHandler } from "./application/commands/partners/add-partner-tag/add-partner-tag.handler";
import { RemovePartnerTagHandler } from "./application/commands/partners/remove-partner-tag/remove-partner-tag.handler";
import { DeletePartnerHandler } from "./application/commands/partners/delete-partner/delete-partner.handler";
import { MergePartnersHandler } from "./application/commands/partners/merge-partners/merge-partners.handler";
import { UpsertCompanyProfileHandler } from "./application/commands/company-profiles/upsert-company-profile/upsert-company-profile.handler";
import { AddContactHandler } from "./application/commands/contacts/add-contact/add-contact.handler";
import { UpdateContactHandler } from "./application/commands/contacts/update-contact/update-contact.handler";
import { RemoveContactHandler } from "./application/commands/contacts/remove-contact/remove-contact.handler";
import { SetPrimaryContactHandler } from "./application/commands/contacts/set-primary-contact/set-primary-contact.handler";
import { AddAddressHandler } from "./application/commands/addresses/add-address/add-address.handler";
import { UpdateAddressHandler } from "./application/commands/addresses/update-address/update-address.handler";
import { RemoveAddressHandler } from "./application/commands/addresses/remove-address/remove-address.handler";
import { SetDefaultAddressHandler } from "./application/commands/addresses/set-default-address/set-default-address.handler";
import { AddNoteHandler } from "./application/commands/notes/add-note/add-note.handler";
import { UpdateNoteHandler } from "./application/commands/notes/update-note/update-note.handler";
import { DeleteNoteHandler } from "./application/commands/notes/delete-note/delete-note.handler";
import { PinNoteHandler } from "./application/commands/notes/pin-note/pin-note.handler";
// --- query handler'ları ---
import { GetPartnerHandler } from "./application/queries/partners/get-partner/get-partner.handler";
import { ListPartnersHandler } from "./application/queries/partners/list-partners/list-partners.handler";
import { FindDuplicatePartnersHandler } from "./application/queries/partners/find-duplicate-partners/find-duplicate-partners.handler";
import { GetPartnerTimelineHandler } from "./application/queries/partners/get-partner-timeline/get-partner-timeline.handler";
import { ListPartnerContactsHandler } from "./application/queries/contacts/list-partner-contacts/list-partner-contacts.handler";
import { SearchContactsHandler } from "./application/queries/contacts/search-contacts/search-contacts.handler";
import { ListPartnerAddressesHandler } from "./application/queries/addresses/list-partner-addresses/list-partner-addresses.handler";
import { ListPartnerNotesHandler } from "./application/queries/notes/list-partner-notes/list-partner-notes.handler";

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

// PartnerCommandHandlerBase'i genişleten handler'ların ortak bağımlılıkları.
const PARTNER_MUTATION_DEPS = [
  DrizzlePartnerRepository, DrizzlePartnerActivityRepository,
  KafkaEventPublisher, DrizzleUnitOfWork, RequestActorContext];
const CONTACT_MUTATION_DEPS = [
  DrizzlePartnerRepository, DrizzleContactRepository,
  KafkaEventPublisher, DrizzleUnitOfWork, RequestActorContext];
const ADDRESS_MUTATION_DEPS = [
  DrizzlePartnerRepository, DrizzleAddressRepository,
  DrizzleUnitOfWork, RequestActorContext];
const NOTE_MUTATION_DEPS = [
  DrizzlePartnerRepository, DrizzleNoteRepository,
  DrizzleUnitOfWork, RequestActorContext];

@Module({
  imports: [KafkaModule],
  controllers: [
    CustomerController,
    PartnersController,
    PartnerContactsController,
    PartnerAddressesController,
    PartnerNotesController,
    CustomerEventConsumer,
  ],
  providers: [
    {
      provide: CustomerHealthService,
      useFactory: (
        session: DrizzleTransactionHost,
        kafkaClient: ClientKafka,
      ) => new CustomerHealthService(session, kafkaClient),
      inject: [DrizzleTransactionHost, KAFKA_CLIENT],
    },
    // --- persistence çekirdeği ---
    {
      provide: DrizzleTransactionHost,
      useFactory: () => new DrizzleTransactionHost(writeDb),
    },
    handlerProvider(DrizzleUnitOfWork, [DrizzleTransactionHost]),

    // --- repository'ler ---
    handlerProvider(DrizzlePartnerRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleCompanyProfileRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleContactRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleAddressRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleNoteRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzlePartnerActivityRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleCompanyReferenceRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleProductReferenceRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleOutboxRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleProcessedEventRepository, [DrizzleTransactionHost]),

    // --- aktör kapsamı (şirket izolasyonu + createdBy/yazar) ---
    { provide: RequestActorContext, useFactory: () => new RequestActorContext() },

    // --- correlation bağlamı (HTTP middleware + consumer + outbox) ---
    { provide: CorrelationContext, useFactory: () => new CorrelationContext() },

    // --- event publisher (transactional outbox'a yazar) ---
    handlerProvider(KafkaEventPublisher, [DrizzleOutboxRepository, CorrelationContext]),

    // --- partner command'ları ---
    handlerProvider(CreatePartnerHandler, [
      DrizzlePartnerRepository, DrizzlePartnerActivityRepository,
      DrizzleCompanyReferenceRepository,
      KafkaEventPublisher, DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(UpdatePartnerHandler, PARTNER_MUTATION_DEPS),
    handlerProvider(ExpandPartnerTypeHandler, PARTNER_MUTATION_DEPS),
    handlerProvider(ChangePartnerStatusHandler, PARTNER_MUTATION_DEPS),
    handlerProvider(UpdateSalesFunnelStageHandler, PARTNER_MUTATION_DEPS),
    handlerProvider(AssignPartnerHandler, PARTNER_MUTATION_DEPS),
    handlerProvider(AddPartnerTagHandler, PARTNER_MUTATION_DEPS),
    handlerProvider(RemovePartnerTagHandler, PARTNER_MUTATION_DEPS),
    handlerProvider(DeletePartnerHandler, PARTNER_MUTATION_DEPS),
    handlerProvider(MergePartnersHandler, [
      DrizzlePartnerRepository, DrizzlePartnerActivityRepository,
      DrizzleCompanyProfileRepository, DrizzleContactRepository,
      DrizzleAddressRepository, DrizzleNoteRepository,
      KafkaEventPublisher, DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(UpsertCompanyProfileHandler, [
      DrizzlePartnerRepository, DrizzleCompanyProfileRepository,
      DrizzleUnitOfWork, RequestActorContext]),

    // --- kişi command'ları ---
    handlerProvider(AddContactHandler, CONTACT_MUTATION_DEPS),
    handlerProvider(UpdateContactHandler, CONTACT_MUTATION_DEPS),
    handlerProvider(RemoveContactHandler, [
      DrizzlePartnerRepository, DrizzleContactRepository,
      DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(SetPrimaryContactHandler, CONTACT_MUTATION_DEPS),

    // --- adres command'ları ---
    handlerProvider(AddAddressHandler, ADDRESS_MUTATION_DEPS),
    handlerProvider(UpdateAddressHandler, ADDRESS_MUTATION_DEPS),
    handlerProvider(RemoveAddressHandler, ADDRESS_MUTATION_DEPS),
    handlerProvider(SetDefaultAddressHandler, ADDRESS_MUTATION_DEPS),

    // --- not command'ları ---
    handlerProvider(AddNoteHandler, NOTE_MUTATION_DEPS),
    handlerProvider(UpdateNoteHandler, NOTE_MUTATION_DEPS),
    handlerProvider(DeleteNoteHandler, NOTE_MUTATION_DEPS),
    handlerProvider(PinNoteHandler, NOTE_MUTATION_DEPS),

    // --- query'ler ---
    handlerProvider(GetPartnerHandler, [
      DrizzlePartnerRepository, DrizzleCompanyProfileRepository,
      DrizzleContactRepository, DrizzleAddressRepository,
      DrizzleNoteRepository, RequestActorContext]),
    handlerProvider(ListPartnersHandler, [
      DrizzlePartnerRepository, DrizzleCompanyReferenceRepository, RequestActorContext]),
    handlerProvider(FindDuplicatePartnersHandler, [
      DrizzleCompanyProfileRepository, DrizzleContactRepository, RequestActorContext]),
    handlerProvider(GetPartnerTimelineHandler, [
      DrizzlePartnerRepository, DrizzlePartnerActivityRepository,
      DrizzleNoteRepository, RequestActorContext]),
    handlerProvider(ListPartnerContactsHandler, [
      DrizzlePartnerRepository, DrizzleContactRepository, RequestActorContext]),
    handlerProvider(SearchContactsHandler, [
      DrizzleContactRepository, RequestActorContext]),
    handlerProvider(ListPartnerAddressesHandler, [
      DrizzlePartnerRepository, DrizzleAddressRepository, RequestActorContext]),
    handlerProvider(ListPartnerNotesHandler, [
      DrizzlePartnerRepository, DrizzleNoteRepository, RequestActorContext]),

    // --- tüketilen event handler'ları ---
    handlerProvider(CompanyCreatedHandler, [DrizzleCompanyReferenceRepository]),
    handlerProvider(CompanyStatusChangedHandler, [DrizzleCompanyReferenceRepository]),
    handlerProvider(ProductCreatedHandler, [DrizzleProductReferenceRepository]),
    handlerProvider(ProductStatusChangedHandler, [DrizzleProductReferenceRepository]),

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
    // LISTEN, havuzdan bağımsız kendi bağlantısını kullanır; drizzle'ın
    // sarmaladığı ham postgres-js client'ı bu yüzden doğrudan verilir.
    {
      provide: OutboxWakeupListener,
      useFactory: (worker: OutboxPublisherWorker) =>
        new OutboxWakeupListener(writeDb.$client, worker),
      inject: [OutboxPublisherWorker],
    },
    handlerProvider(MessagingWorkersLifecycle, [
      OutboxPublisherWorker, OutboxWakeupListener]),

    // --- idempotent consumer dispatcher'ı ---
    {
      provide: ConsumedEventDispatcher,
      useFactory: (
        unitOfWork: DrizzleUnitOfWork,
        processedEventRepository: DrizzleProcessedEventRepository,
        companyCreatedHandler: CompanyCreatedHandler,
        companyStatusHandler: CompanyStatusChangedHandler,
        productCreatedHandler: ProductCreatedHandler,
        productStatusHandler: ProductStatusChangedHandler,
      ) =>
        new ConsumedEventDispatcher(
          unitOfWork,
          processedEventRepository,
          new Map<string, IConsumedEventHandler>([
            ["company.created", companyCreatedHandler],
            ["company.updated", companyCreatedHandler],
            ["company.activated", companyStatusHandler],
            ["company.deactivated", companyStatusHandler],
            // inventory-service ürün kataloğu: snapshot upsert + durum geçişleri.
            ["product.created", productCreatedHandler],
            ["product.updated", productCreatedHandler],
            ["product.activated", productStatusHandler],
            ["product.deactivated", productStatusHandler],
            ["product.archived", productStatusHandler],
            ["product.deleted", productStatusHandler],
          ]),
        ),
      inject: [
        DrizzleUnitOfWork,
        DrizzleProcessedEventRepository,
        CompanyCreatedHandler,
        CompanyStatusChangedHandler,
        ProductCreatedHandler,
        ProductStatusChangedHandler,
      ],
    },
  ],
})
export class CustomerModule {}
