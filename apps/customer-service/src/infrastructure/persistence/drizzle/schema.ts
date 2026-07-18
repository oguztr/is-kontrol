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

/* ============================================================================
 * CUSTOMER-MANAGEMENT (MİNİ CRM) SERVİSİ — WRITE DB ŞEMASI
 *
 * Partner (müşteri + tedarikçi tek modelde) bu servisin source of truth'udur;
 * inventory-management'taki business_partner_references tablosu buradan
 * yayınlanan partner.* event'leriyle beslenir.
 *
 * Başka servislerin sahip olduğu veriler (Tenant/şirket) burada "reference"
 * (cache) tablo olarak, Kafka event'leriyle senkronize tutulur. Reference
 * tablolara kasıtlı olarak hard FK verilmez (event sırası garanti edilemez);
 * referans bütünlüğü command handler'larda doğrulanır.
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
 * BÖLÜM 1 — REFERENCE TABLOLAR (CACHE)
 * ==========================================================================*/

export const companyReferences = pgTable("company_references", {
  id: uuid("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  baseCurrencyCode: varchar("base_currency_code", { length: 3 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  syncedAt: timestamp("synced_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* inventory-service'in product.* event'leriyle beslenen ürün kataloğu cache'i;
 * partner etkileşimlerinde (teklif/sipariş bağlamı) ürün adı/SKU göstermek ve
 * doğrulamak için kullanılır. Arşivlenen/silinen ürün pasif işaretlenir. */
export const productReferences = pgTable(
  "product_references",
  {
    id: uuid("id").primaryKey(),
    companyId: uuid("company_id").notNull(),
    sku: varchar("sku", { length: 100 }).notNull(),
    barcode: varchar("barcode", { length: 100 }),
    name: varchar("name", { length: 255 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    syncedAt: timestamp("synced_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    companyIdx: index("idx_product_ref_company").on(t.companyId),
  }),
);

/* ============================================================================
 * BÖLÜM 2 — CRM DOMAIN (BU SERVİSİN SAHİP OLDUĞU VERİ)
 * ==========================================================================*/

export const partnerTypeEnum = pgEnum("partner_type", [
  "CUSTOMER",
  "SUPPLIER",
  "BOTH",
]);

export const partnerKindEnum = pgEnum("partner_kind", [
  "INDIVIDUAL",
  "CORPORATE",
]);

export const partnerStatusEnum = pgEnum("partner_status", [
  "ACTIVE",
  "PASSIVE",
  "BLACKLISTED",
]);

export const salesFunnelStageEnum = pgEnum("sales_funnel_stage", [
  "LEAD",
  "PROSPECT",
  "CUSTOMER",
]);

export const addressTypeEnum = pgEnum("address_type", [
  "BILLING",
  "SHIPPING",
  "HEADQUARTERS",
  "OTHER",
]);

export const noteTypeEnum = pgEnum("note_type", [
  "NOTE",
  "CALL",
  "MEETING",
  "EMAIL",
]);

export const partners = pgTable(
  "partners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: partnerTypeEnum("type").notNull(),
    kind: partnerKindEnum("kind").notNull(),
    status: partnerStatusEnum("status").notNull().default("ACTIVE"),
    salesFunnelStage: salesFunnelStageEnum("sales_funnel_stage"),
    assignedUserId: uuid("assigned_user_id"),
    tags: text("tags").array().notNull().default([]),
    /** Merge sonrası kaybeden kayıt; tüketiciler için eski→yeni yönlendirmesi. */
    mergedIntoId: uuid("merged_into_id"),
    createdBy: uuid("created_by"),
    ...timestamps,
  },
  (t) => ({
    companyIdx: index("idx_partners_company").on(t.companyId),
    companyStatusIdx: index("idx_partners_company_status").on(
      t.companyId,
      t.status,
    ),
    nameIdx: index("idx_partners_name").on(t.companyId, t.name),
  }),
);

export const partnerCompanyProfiles = pgTable(
  "partner_company_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    partnerId: uuid("partner_id").notNull(),
    tradeName: varchar("trade_name", { length: 255 }).notNull(),
    taxNumber: varchar("tax_number", { length: 20 }),
    taxOffice: varchar("tax_office", { length: 100 }),
    industry: varchar("industry", { length: 100 }),
    website: varchar("website", { length: 255 }),
    parentPartnerId: uuid("parent_partner_id"),
    paymentTermDays: integer("payment_term_days"),
    preferredCurrencyCode: varchar("preferred_currency_code", { length: 3 }),
    ...timestamps,
  },
  (t) => ({
    uniqPartner: uniqueIndex("uq_company_profile_partner").on(t.partnerId),
    taxNumberIdx: index("idx_company_profile_tax_number").on(t.taxNumber),
  }),
);

export const partnerContacts = pgTable(
  "partner_contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    partnerId: uuid("partner_id").notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    title: varchar("title", { length: 100 }),
    department: varchar("department", { length: 100 }),
    phone: varchar("phone", { length: 30 }),
    email: varchar("email", { length: 255 }),
    isPrimary: boolean("is_primary").notNull().default(false),
    ...timestamps,
  },
  (t) => ({
    partnerIdx: index("idx_contacts_partner").on(t.partnerId),
    emailIdx: index("idx_contacts_email").on(t.email),
    phoneIdx: index("idx_contacts_phone").on(t.phone),
  }),
);

export const partnerAddresses = pgTable(
  "partner_addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    partnerId: uuid("partner_id").notNull(),
    type: addressTypeEnum("type").notNull(),
    label: varchar("label", { length: 100 }),
    line1: varchar("line1", { length: 255 }).notNull(),
    line2: varchar("line2", { length: 255 }),
    city: varchar("city", { length: 100 }).notNull(),
    district: varchar("district", { length: 100 }),
    postalCode: varchar("postal_code", { length: 20 }),
    country: varchar("country", { length: 100 }).notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    ...timestamps,
  },
  (t) => ({
    partnerIdx: index("idx_addresses_partner").on(t.partnerId),
  }),
);

export const partnerNotes = pgTable(
  "partner_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    partnerId: uuid("partner_id").notNull(),
    type: noteTypeEnum("type").notNull(),
    content: text("content").notNull(),
    pinned: boolean("pinned").notNull().default(false),
    authorUserId: uuid("author_user_id"),
    ...timestamps,
  },
  (t) => ({
    partnerIdx: index("idx_notes_partner").on(t.partnerId, t.createdAt),
  }),
);

/* Durum/tip/aşama değişikliklerinin audit izi; notlarla birlikte aktivite
 * zaman çizelgesini besler. */
export const partnerActivities = pgTable(
  "partner_activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    partnerId: uuid("partner_id").notNull(),
    kind: varchar("kind", { length: 40 }).notNull(),
    detail: jsonb("detail").notNull().default({}),
    actorUserId: uuid("actor_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    partnerIdx: index("idx_activities_partner").on(t.partnerId, t.createdAt),
  }),
);

/* ============================================================================
 * BÖLÜM 3 — EVENT ALTYAPISI (OUTBOX + INBOX)
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

/* Idempotent consumer kaydı: bir event ilk kez işlenirken buraya, handler'ın
 * yaptığı yazmalarla AYNI transaction içinde insert edilir. Aynı event tekrar
 * teslim edilirse (at-least-once) insert çakışır ve işleme atlanır. */
export const processedEvents = pgTable("processed_events", {
  eventId: varchar("event_id", { length: 200 }).primaryKey(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
