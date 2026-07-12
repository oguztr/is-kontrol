import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

/* ============================================================================
 * INVENTORY-MANAGEMENT SERVİSİ — WRITE DB ŞEMASI
 *
 * Mikroservis mimarisi kuralı: bu DB'de SADECE bu servisin sahip olduğu
 * (source of truth) veriler gerçek anlamda yönetilir. Başka servislerin
 * (Tenant, Finance, CRM) sahip olduğu veriler burada "reference" (cache)
 * tablo olarak, ilgili servislerden gelen Kafka event'leri ile senkronize
 * edilerek tutulur. Bu tablolar salt-okunurdur; uygulama kodu bunlara asla
 * doğrudan INSERT/UPDATE yapmaz, sadece event consumer'lar günceller.
 *
 * Reference tablolara kasıtlı olarak hard FK verilmez (event sırası garanti
 * edilemez); referans bütünlüğü uygulama seviyesinde, command handler'larda
 * doğrulanır.
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
 * Sahibi bu servis DEĞİL. Sadece ilgili event'ler tüketilerek güncellenir.
 * Aralarında KASITLI OLARAK hard FK yok (event sırası garanti edilemez).
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

export const currencyReferences = pgTable("currency_references", {
  id: uuid("id").primaryKey(),
  code: varchar("code", { length: 3 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  decimalPlaces: integer("decimal_places").notNull().default(2),
  isActive: boolean("is_active").notNull().default(true),
  syncedAt: timestamp("synced_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const exchangeRateReferences = pgTable(
  "exchange_rate_references",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),
    currencyCode: varchar("currency_code", { length: 3 }).notNull(),
    rate: numeric("rate", { precision: 18, scale: 8 }).notNull(),
    effectiveAt: timestamp("effective_at", { withTimezone: true }).notNull(),
    syncedAt: timestamp("synced_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqCompanyCurrency: uniqueIndex("uq_exrate_ref_company_currency").on(
      t.companyId,
      t.currencyCode,
    ),
  }),
);

export const businessPartnerReferences = pgTable(
  "business_partner_references",
  {
    id: uuid("id").primaryKey(),
    companyId: uuid("company_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 20 }).notNull(), // SUPPLIER / CUSTOMER / BOTH
    isActive: boolean("is_active").notNull().default(true),
    syncedAt: timestamp("synced_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    companyIdx: index("idx_partner_ref_company").on(t.companyId),
  }),
);

/* ============================================================================
 * BÖLÜM 2 — INVENTORY DOMAIN (BU SERVİSİN SAHİP OLDUĞU VERİ)
 * ==========================================================================*/

export const documentTypeEnum = pgEnum("document_type", [
  "PURCHASE",
  "SALE",
  "TRANSFER",
  "ADJUSTMENT",
  "RETURN_IN",
  "RETURN_OUT",
  "PRODUCTION_IN",
  "PRODUCTION_OUT",
  "OPENING",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "DRAFT",
  "POSTED",
  "CANCELLED",
]);

export const movementDirectionEnum = pgEnum("movement_direction", [
  "IN",
  "OUT",
]);

export const unitGroups = pgTable(
  "unit_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    ...timestamps,
  },
  (t) => ({
    uniqCompanyName: uniqueIndex("uq_unit_group_company_name").on(
      t.companyId,
      t.name,
    ),
  }),
);

export const unitsOfMeasure = pgTable(
  "units_of_measure",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),
    unitGroupId: uuid("unit_group_id")
      .notNull()
      .references(() => unitGroups.id, { onDelete: "restrict" }),
    code: varchar("code", { length: 20 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    isBaseUnit: boolean("is_base_unit").notNull().default(false),
    factorToBase: numeric("factor_to_base", { precision: 18, scale: 6 })
      .notNull()
      .default("1"),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => ({
    uniqCompanyCode: uniqueIndex("uq_unit_company_code").on(
      t.companyId,
      t.code,
    ),
  }),
);

export const warehouses = pgTable(
  "warehouses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),
    code: varchar("code", { length: 20 }).notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    address: text("address"),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => ({
    uniqCompanyCode: uniqueIndex("uq_warehouse_company_code").on(
      t.companyId,
      t.code,
    ),
  }),
);

export const productCategories = pgTable(
  "product_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => productCategories.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 150 }).notNull(),
    ...timestamps,
  },
  (t) => ({
    companyIdx: index("idx_category_company").on(t.companyId),
  }),
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),
    categoryId: uuid("category_id").references(() => productCategories.id, {
      onDelete: "set null",
    }),
    sku: varchar("sku", { length: 100 }).notNull(),
    barcode: varchar("barcode", { length: 100 }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    baseUnitId: uuid("base_unit_id")
      .notNull()
      .references(() => unitsOfMeasure.id, { onDelete: "restrict" }),
    defaultCurrencyId: uuid("default_currency_id"),
    minStockLevel: numeric("min_stock_level", {
      precision: 18,
      scale: 4,
    }).default("0"),
    maxStockLevel: numeric("max_stock_level", { precision: 18, scale: 4 }),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => ({
    uniqCompanySku: uniqueIndex("uq_product_company_sku").on(
      t.companyId,
      t.sku,
    ),
    companyIdx: index("idx_product_company").on(t.companyId),
  }),
);

export const productUnits = pgTable(
  "product_units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => unitsOfMeasure.id, { onDelete: "restrict" }),
    conversionFactor: numeric("conversion_factor", { precision: 18, scale: 6 })
      .notNull()
      .default("1"),
    isPurchaseUnit: boolean("is_purchase_unit").notNull().default(true),
    isSalesUnit: boolean("is_sales_unit").notNull().default(true),
    barcode: varchar("barcode", { length: 100 }),
    ...timestamps,
  },
  (t) => ({
    uniqProductUnit: uniqueIndex("uq_product_unit").on(t.productId, t.unitId),
  }),
);

export const stockDocuments = pgTable(
  "stock_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),
    documentNumber: varchar("document_number", { length: 50 }).notNull(),
    documentType: documentTypeEnum("document_type").notNull(),
    status: documentStatusEnum("status").notNull().default("DRAFT"),
    warehouseId: uuid("warehouse_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "restrict" }),
    targetWarehouseId: uuid("target_warehouse_id").references(
      () => warehouses.id,
      { onDelete: "restrict" },
    ),
    partnerId: uuid("partner_id"),
    currencyId: uuid("currency_id").notNull(),
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 8 })
      .notNull()
      .default("1"),
    documentDate: timestamp("document_date", { withTimezone: true }).notNull(),
    notes: text("notes"),
    createdBy: uuid("created_by"),
    ...timestamps,
  },
  (t) => ({
    uniqCompanyDocNumber: uniqueIndex("uq_document_company_number").on(
      t.companyId,
      t.documentNumber,
    ),
    companyDateIdx: index("idx_document_company_date").on(
      t.companyId,
      t.documentDate,
    ),
  }),
);

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => stockDocuments.id, { onDelete: "cascade" }),
    lineNumber: integer("line_number").notNull().default(1),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    warehouseId: uuid("warehouse_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "restrict" }),
    direction: movementDirectionEnum("direction").notNull(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => unitsOfMeasure.id, { onDelete: "restrict" }),
    quantity: numeric("quantity", { precision: 18, scale: 4 }).notNull(),
    baseQuantity: numeric("base_quantity", {
      precision: 18,
      scale: 4,
    }).notNull(),
    unitPrice: numeric("unit_price", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    currencyId: uuid("currency_id").notNull(),
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 8 })
      .notNull()
      .default("1"),
    totalAmount: numeric("total_amount", { precision: 18, scale: 4 }).notNull(),
    totalAmountBaseCurrency: numeric("total_amount_base_currency", {
      precision: 18,
      scale: 4,
    }).notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => ({
    uniqDocumentLine: uniqueIndex("uq_movement_document_line").on(
      t.documentId,
      t.lineNumber,
    ),
    productWarehouseIdx: index("idx_movement_product_warehouse").on(
      t.productId,
      t.warehouseId,
    ),
    companyIdx: index("idx_movement_company").on(t.companyId),
  }),
);

export const stockBalances = pgTable(
  "stock_balances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),
    warehouseId: uuid("warehouse_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: numeric("quantity", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    averageCost: numeric("average_cost", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    lastMovementId: uuid("last_movement_id").references(
      () => stockMovements.id,
      { onDelete: "set null" },
    ),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqWarehouseProduct: uniqueIndex("uq_balance_warehouse_product").on(
      t.warehouseId,
      t.productId,
    ),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => ({
    unpublishedIdx: index("idx_outbox_unpublished").on(t.publishedAt),
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
