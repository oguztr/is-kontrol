import { Module } from "@nestjs/common";
import type { InjectionToken, Provider } from "@nestjs/common";
import type { ClientKafka } from "@nestjs/microservices";
import { IdentityController } from "./identity.controller";
import { IdentityHealthService } from "./identity-health.service";
import { AuthController } from "./interface/http/controllers/auth.controller";
import { CompaniesController } from "./interface/http/controllers/companies.controller";
import { UsersController } from "./interface/http/controllers/users.controller";
import { RolesController } from "./interface/http/controllers/roles.controller";
import { KafkaModule, KAFKA_CLIENT } from "./infrastructure/messaging/kafka/kafka.module";
import { writeDb, DrizzleTransactionHost } from "./infrastructure/persistence/drizzle/drizzle.provider";
import { DrizzleUnitOfWork } from "./infrastructure/persistence/drizzle/unit-of-work";
import { DrizzleCompanyRepository } from "./infrastructure/persistence/drizzle/repositories/company.repository";
import { DrizzleUserRepository } from "./infrastructure/persistence/drizzle/repositories/user.repository";
import { DrizzleRoleRepository } from "./infrastructure/persistence/drizzle/repositories/role.repository";
import { DrizzleInvitationRepository } from "./infrastructure/persistence/drizzle/repositories/invitation.repository";
import { DrizzleRefreshTokenRepository } from "./infrastructure/persistence/drizzle/repositories/refresh-token.repository";
import { DrizzleOneTimeTokenRepository } from "./infrastructure/persistence/drizzle/repositories/one-time-token.repository";
import { DrizzleUserPermissionOverrideRepository } from "./infrastructure/persistence/drizzle/repositories/user-permission-override.repository";
import { DrizzleOutboxRepository } from "./infrastructure/persistence/drizzle/repositories/outbox.repository";
import { SystemRolesSeeder } from "./infrastructure/persistence/drizzle/system-roles.seeder";
import { KafkaEventPublisher } from "./infrastructure/messaging/kafka/kafka-event-publisher";
import { CorrelationContext } from "./infrastructure/correlation/correlation-context";
import { RequestActorContext } from "./infrastructure/auth/request-actor-context";
import { OutboxPublisherWorker } from "./infrastructure/messaging/kafka/outbox-publisher.worker";
import { OutboxWakeupListener } from "./infrastructure/messaging/kafka/outbox-wakeup.listener";
import { MessagingWorkersLifecycle } from "./infrastructure/messaging/kafka/messaging-workers.lifecycle";
import { ScryptPasswordHasher } from "./infrastructure/security/scrypt-password-hasher";
import { JoseAccessTokenSigner } from "./infrastructure/security/jose-access-token.signer";
import { authConfig } from "./config/auth.config";
import { AuthSessionFactory } from "./application/commands/auth/auth-session.factory";
// --- command handler'ları ---
import { SignUpHandler } from "./application/commands/companies/sign-up/sign-up.handler";
import { UpdateCompanyHandler } from "./application/commands/companies/update-company/update-company.handler";
import { SuspendCompanyHandler } from "./application/commands/companies/suspend-company/suspend-company.handler";
import { ReactivateCompanyHandler } from "./application/commands/companies/reactivate-company/reactivate-company.handler";
import { DeleteCompanyHandler } from "./application/commands/companies/delete-company/delete-company.handler";
import { InviteUserHandler } from "./application/commands/users/invite-user/invite-user.handler";
import { AcceptInvitationHandler } from "./application/commands/users/accept-invitation/accept-invitation.handler";
import { RevokeInvitationHandler } from "./application/commands/users/revoke-invitation/revoke-invitation.handler";
import { UpdateUserProfileHandler } from "./application/commands/users/update-user-profile/update-user-profile.handler";
import { DeactivateUserHandler } from "./application/commands/users/deactivate-user/deactivate-user.handler";
import { ReactivateUserHandler } from "./application/commands/users/reactivate-user/reactivate-user.handler";
import { DeleteUserHandler } from "./application/commands/users/delete-user/delete-user.handler";
import { AssignRoleHandler } from "./application/commands/users/assign-role/assign-role.handler";
import { LoginHandler } from "./application/commands/auth/login/login.handler";
import { RefreshTokenHandler } from "./application/commands/auth/refresh-token/refresh-token.handler";
import { LogoutHandler } from "./application/commands/auth/logout/logout.handler";
import { ChangePasswordHandler } from "./application/commands/auth/change-password/change-password.handler";
import { RequestPasswordResetHandler } from "./application/commands/auth/request-password-reset/request-password-reset.handler";
import { ResetPasswordHandler } from "./application/commands/auth/reset-password/reset-password.handler";
// --- query handler'ları ---
import { GetCompanyHandler } from "./application/queries/companies/get-company/get-company.handler";
import { ListUsersHandler } from "./application/queries/users/list-users/list-users.handler";
import { ListInvitationsHandler } from "./application/queries/users/list-invitations/list-invitations.handler";
import { ListRolesHandler } from "./application/queries/roles/list-roles/list-roles.handler";

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

// UserCommandHandlerBase'i genişleten handler'ların ortak bağımlılıkları.
const USER_MUTATION_DEPS = [
  DrizzleUserRepository, KafkaEventPublisher,
  DrizzleUnitOfWork, RequestActorContext];

@Module({
  imports: [KafkaModule],
  controllers: [
    IdentityController,
    AuthController,
    CompaniesController,
    UsersController,
    RolesController,
  ],
  providers: [
    {
      provide: IdentityHealthService,
      useFactory: (
        session: DrizzleTransactionHost,
        kafkaClient: ClientKafka,
      ) => new IdentityHealthService(session, kafkaClient),
      inject: [DrizzleTransactionHost, KAFKA_CLIENT],
    },
    // --- persistence çekirdeği ---
    {
      provide: DrizzleTransactionHost,
      useFactory: () => new DrizzleTransactionHost(writeDb),
    },
    handlerProvider(DrizzleUnitOfWork, [DrizzleTransactionHost]),

    // --- repository'ler ---
    handlerProvider(DrizzleCompanyRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleUserRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleRoleRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleInvitationRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleRefreshTokenRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleOneTimeTokenRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleUserPermissionOverrideRepository, [DrizzleTransactionHost]),
    handlerProvider(DrizzleOutboxRepository, [DrizzleTransactionHost]),

    // --- güvenlik ---
    { provide: ScryptPasswordHasher, useFactory: () => new ScryptPasswordHasher() },
    {
      provide: JoseAccessTokenSigner,
      useFactory: () => new JoseAccessTokenSigner(authConfig),
    },
    {
      provide: AuthSessionFactory,
      useFactory: (
        roles: DrizzleRoleRepository,
        overrides: DrizzleUserPermissionOverrideRepository,
        refreshTokens: DrizzleRefreshTokenRepository,
        signer: JoseAccessTokenSigner,
      ) =>
        new AuthSessionFactory(
          roles, overrides, refreshTokens, signer,
          authConfig.refreshTokenTtlDays,
        ),
      inject: [
        DrizzleRoleRepository,
        DrizzleUserPermissionOverrideRepository,
        DrizzleRefreshTokenRepository,
        JoseAccessTokenSigner,
      ],
    },

    // --- aktör kapsamı + correlation bağlamı ---
    { provide: RequestActorContext, useFactory: () => new RequestActorContext() },
    { provide: CorrelationContext, useFactory: () => new CorrelationContext() },

    // --- event publisher (transactional outbox'a yazar) ---
    handlerProvider(KafkaEventPublisher, [DrizzleOutboxRepository, CorrelationContext]),

    // --- sistem rolleri seed'i ---
    handlerProvider(SystemRolesSeeder, [DrizzleRoleRepository, DrizzleUnitOfWork]),

    // --- company command'ları ---
    handlerProvider(SignUpHandler, [
      DrizzleCompanyRepository, DrizzleUserRepository, DrizzleRoleRepository,
      ScryptPasswordHasher, KafkaEventPublisher, DrizzleUnitOfWork]),
    handlerProvider(UpdateCompanyHandler, [
      DrizzleCompanyRepository, KafkaEventPublisher,
      DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(SuspendCompanyHandler, [
      DrizzleCompanyRepository, KafkaEventPublisher,
      DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(ReactivateCompanyHandler, [
      DrizzleCompanyRepository, KafkaEventPublisher,
      DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(DeleteCompanyHandler, [
      DrizzleCompanyRepository, KafkaEventPublisher,
      DrizzleUnitOfWork, RequestActorContext]),

    // --- kullanıcı command'ları ---
    {
      provide: InviteUserHandler,
      useFactory: (
        companies: DrizzleCompanyRepository,
        users: DrizzleUserRepository,
        roles: DrizzleRoleRepository,
        invitations: DrizzleInvitationRepository,
        unitOfWork: DrizzleUnitOfWork,
        actor: RequestActorContext,
      ) =>
        new InviteUserHandler(
          companies, users, roles, invitations, unitOfWork, actor,
          authConfig.invitationTtlHours,
        ),
      inject: [
        DrizzleCompanyRepository, DrizzleUserRepository, DrizzleRoleRepository,
        DrizzleInvitationRepository, DrizzleUnitOfWork, RequestActorContext,
      ],
    },
    handlerProvider(AcceptInvitationHandler, [
      DrizzleInvitationRepository, DrizzleUserRepository,
      DrizzleCompanyRepository, ScryptPasswordHasher,
      KafkaEventPublisher, DrizzleUnitOfWork]),
    handlerProvider(RevokeInvitationHandler, [
      DrizzleInvitationRepository, DrizzleUnitOfWork, RequestActorContext]),
    handlerProvider(UpdateUserProfileHandler, USER_MUTATION_DEPS),
    handlerProvider(DeactivateUserHandler, [
      ...USER_MUTATION_DEPS, DrizzleRefreshTokenRepository]),
    handlerProvider(ReactivateUserHandler, USER_MUTATION_DEPS),
    handlerProvider(DeleteUserHandler, [
      ...USER_MUTATION_DEPS, DrizzleRefreshTokenRepository]),
    handlerProvider(AssignRoleHandler, [
      ...USER_MUTATION_DEPS, DrizzleRoleRepository]),

    // --- auth command'ları ---
    handlerProvider(LoginHandler, [
      DrizzleUserRepository, DrizzleCompanyRepository,
      ScryptPasswordHasher, AuthSessionFactory, DrizzleUnitOfWork]),
    handlerProvider(RefreshTokenHandler, [
      DrizzleRefreshTokenRepository, DrizzleUserRepository,
      DrizzleCompanyRepository, AuthSessionFactory, DrizzleUnitOfWork]),
    handlerProvider(LogoutHandler, [
      DrizzleRefreshTokenRepository, DrizzleUnitOfWork]),
    handlerProvider(ChangePasswordHandler, [
      DrizzleUserRepository, DrizzleRefreshTokenRepository,
      ScryptPasswordHasher, DrizzleUnitOfWork, RequestActorContext]),
    {
      provide: RequestPasswordResetHandler,
      useFactory: (
        users: DrizzleUserRepository,
        oneTimeTokens: DrizzleOneTimeTokenRepository,
        unitOfWork: DrizzleUnitOfWork,
      ) =>
        new RequestPasswordResetHandler(
          users, oneTimeTokens, unitOfWork,
          authConfig.passwordResetTtlMinutes,
        ),
      inject: [
        DrizzleUserRepository, DrizzleOneTimeTokenRepository, DrizzleUnitOfWork,
      ],
    },
    handlerProvider(ResetPasswordHandler, [
      DrizzleUserRepository, DrizzleOneTimeTokenRepository,
      DrizzleRefreshTokenRepository, ScryptPasswordHasher, DrizzleUnitOfWork]),

    // --- query'ler ---
    handlerProvider(GetCompanyHandler, [
      DrizzleCompanyRepository, RequestActorContext]),
    handlerProvider(ListUsersHandler, [
      DrizzleUserRepository, DrizzleRoleRepository, RequestActorContext]),
    handlerProvider(ListInvitationsHandler, [
      DrizzleInvitationRepository, RequestActorContext]),
    handlerProvider(ListRolesHandler, [
      DrizzleRoleRepository, RequestActorContext]),

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
  ],
})
export class IdentityModule {}
