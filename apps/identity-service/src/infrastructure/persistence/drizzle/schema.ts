import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/* ============================================================================
 * TENANT/IDENTITY (AUTH) SERVİSİ — WRITE DB ŞEMASI
 *
 * Bu servis Company (tenant) ve User verilerinin source of truth'udur;
 * inventory-management ve customer-management'taki company_references
 * tabloları buradan yayınlanan company.* event'leriyle beslenir.
 *
 * Event zincirinin en başında durur: başka servisten event DİNLEMEZ, bu
 * yüzden reference (cache) tablosu ve processed_events (inbox) tablosu YOK.
 * Tüm veri bu servisin kendi malı olduğu için tablolar arası hard FK
 * kullanmak serbesttir (diğer servislerdeki "reference'a FK verilmez"
 * kısıtı burada geçerli değil).
 *
 * Güvenlik notu: refresh/reset/davet token'larının kendisi ASLA saklanmaz;
 * sadece SHA-256 hash'i saklanır. DB sızsa bile token'lar kullanılamaz.
 * ==========================================================================*/

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

/* ============================================================================
 * BÖLÜM 1 — TENANT (COMPANY)
 * ==========================================================================*/

export const companyStatusEnum = pgEnum("company_status", [
  "ACTIVE",
  "SUSPENDED", // ödeme sorunu/ihlal — tüm kullanıcıların girişi engellenir
]);

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    baseCurrencyCode: varchar("base_currency_code", { length: 3 })
      .notNull()
      .default("TRY"),
    timezone: varchar("timezone", { length: 50 })
      .notNull()
      .default("Europe/Istanbul"),
    locale: varchar("locale", { length: 10 }).notNull().default("tr-TR"),
    status: companyStatusEnum("status").notNull().default("ACTIVE"),
    suspendedAt: timestamp("suspended_at", { withTimezone: true }),
    /** SaaS plan bilgisi; şimdilik tek tier, ileride genişler. */
    planTier: varchar("plan_tier", { length: 30 }).notNull().default("FREE"),
    maxUsers: integer("max_users"),
    featureFlags: jsonb("feature_flags").notNull().default({}),
    ...timestamps,
  },
  (t) => ({
    statusIdx: index("idx_companies_status").on(t.status),
  }),
);

/* ============================================================================
 * BÖLÜM 2 — RBAC (ROL + İZİN)
 *
 * İzinler ayrı tabloda değil, rolün üzerinde "resource:action" string
 * dizisi olarak tutulur ("inventory:write", "crm:read", "identity:admin").
 * İzin seti JWT'ye claim olarak gömülür; diğer servisler kendi guard'larında
 * (libs/shared/auth) DB'ye hiç bakmadan bu claim'i kontrol eder.
 * ==========================================================================*/

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** NULL = sistem rolü (OWNER/ADMIN/...), tüm firmalar için ortak.
     *  Dolu = o firmaya özel özelleştirilmiş rol. */
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "cascade",
    }),
    code: varchar("code", { length: 50 }).notNull(), // OWNER, ADMIN, MANAGER...
    name: varchar("name", { length: 100 }).notNull(),
    isSystem: boolean("is_system").notNull().default(false),
    permissions: text("permissions").array().notNull().default([]),
    ...timestamps,
  },
  (t) => ({
    uniqSystemCode: uniqueIndex("uq_roles_system_code")
      .on(t.code)
      .where(sql`${t.companyId} IS NULL`),
    uniqCompanyCode: uniqueIndex("uq_roles_company_code")
      .on(t.companyId, t.code)
      .where(sql`${t.companyId} IS NOT NULL`),
  }),
);

/* ============================================================================
 * BÖLÜM 3 — KULLANICI
 * ==========================================================================*/

export const userStatusEnum = pgEnum("user_status", [
  "ACTIVE",
  "DEACTIVATED", // işten ayrılma vb. — kayıt durur, giriş engellenir
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "restrict" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    email: varchar("email", { length: 255 }).notNull(),
    /** Argon2id/bcrypt hash'i; kullanıcı ya sign-up'ta ya davet kabulünde
     *  şifresiyle birlikte oluştuğu için her zaman dolu. */
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    avatarUrl: varchar("avatar_url", { length: 500 }),
    status: userStatusEnum("status").notNull().default("ACTIVE"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    /* Login yalnızca e-posta+şifre ile (firma seçtirmeden) yapıldığı için
     * e-posta GLOBAL unique — soft-delete edilmiş kayıtlar hariç. */
    uniqEmail: uniqueIndex("uq_users_email")
      .on(t.email)
      .where(sql`${t.deletedAt} IS NULL`),
    companyIdx: index("idx_users_company").on(t.companyId),
  }),
);

/* Rolden bağımsız kişiye özel ek (ALLOW) / eksik (DENY) izin. DENY her zaman
 * ALLOW'dan ve rol izninden önceliklidir. Token üretilirken rol izinleriyle
 * birleştirilip efektif izin seti JWT'ye yazılır. */
export const permissionEffectEnum = pgEnum("permission_effect", [
  "ALLOW",
  "DENY",
]);

export const userPermissionOverrides = pgTable(
  "user_permission_overrides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permission: varchar("permission", { length: 100 }).notNull(),
    effect: permissionEffectEnum("effect").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqUserPermission: uniqueIndex("uq_override_user_permission").on(
      t.userId,
      t.permission,
    ),
  }),
);

/* ============================================================================
 * BÖLÜM 4 — DAVET
 * User kaydı davet kabulünde oluşur; bekleyen davet users tablosunda değil
 * burada yaşar. Aynı e-postaya aynı firmadan tek AKTİF davet olabilir.
 * ==========================================================================*/

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    email: varchar("email", { length: 255 }).notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    invitedByUserId: uuid("invited_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqTokenHash: uniqueIndex("uq_invitations_token_hash").on(t.tokenHash),
    uniqPendingEmail: uniqueIndex("uq_invitations_pending_email")
      .on(t.companyId, t.email)
      .where(sql`${t.acceptedAt} IS NULL AND ${t.revokedAt} IS NULL`),
  }),
);

/* ============================================================================
 * BÖLÜM 5 — TOKEN'LAR (REFRESH + TEK KULLANIMLIK)
 * ==========================================================================*/

/* Refresh token rotasyonu: her refresh'te eski token revoke edilip aynı
 * familyId ile yenisi yazılır (replacedByTokenId zinciri). Revoke edilmiş
 * bir token tekrar kullanılırsa çalıntı kabul edilir ve tüm family revoke
 * edilir. "Tüm cihazlardan çıkış" = kullanıcının tüm satırlarını revoke et. */
export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    familyId: uuid("family_id").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    replacedByTokenId: uuid("replaced_by_token_id"),
    userAgent: varchar("user_agent", { length: 500 }),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqTokenHash: uniqueIndex("uq_refresh_tokens_hash").on(t.tokenHash),
    userIdx: index("idx_refresh_tokens_user").on(t.userId),
    familyIdx: index("idx_refresh_tokens_family").on(t.familyId),
  }),
);

/* Şifre sıfırlama + e-posta doğrulama: süreli, tek kullanımlık. Yeni token
 * üretilirken kullanıcının aynı amaçlı eski token'ları geçersiz kılınır. */
export const oneTimeTokenPurposeEnum = pgEnum("one_time_token_purpose", [
  "PASSWORD_RESET",
  "EMAIL_VERIFICATION",
]);

export const oneTimeTokens = pgTable(
  "one_time_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: oneTimeTokenPurposeEnum("purpose").notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqTokenHash: uniqueIndex("uq_one_time_tokens_hash").on(t.tokenHash),
    userPurposeIdx: index("idx_one_time_tokens_user_purpose").on(
      t.userId,
      t.purpose,
    ),
  }),
);

/* ============================================================================
 * BÖLÜM 6 — EVENT ALTYAPISI (SADECE OUTBOX)
 * company.* ve user.* event'leri buradan yayınlanır. Inbox/processed_events
 * yok çünkü bu servis event tüketmez.
 * ==========================================================================*/

export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    aggregateType: varchar("aggregate_type", { length: 50 }).notNull(),
    aggregateId: uuid("aggregate_id").notNull(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    payload: jsonb("payload").notNull(),
    correlationId: varchar("correlation_id", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    claimedBy: varchar("claimed_by", { length: 100 }),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    attemptCount: integer("attempt_count").notNull().default(0),
    lastError: text("last_error"),
  },
  (t) => ({
    unpublishedIdx: index("idx_outbox_unpublished").on(t.publishedAt),
    claimableIdx: index("idx_outbox_claimable").on(
      t.publishedAt,
      t.claimedAt,
      t.createdAt,
    ),
    aggregateOrderIdx: index("idx_outbox_aggregate_order").on(
      t.aggregateType,
      t.aggregateId,
      t.createdAt,
      t.id,
    ),
  }),
);
