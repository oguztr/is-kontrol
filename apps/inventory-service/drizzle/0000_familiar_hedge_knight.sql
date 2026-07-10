CREATE TYPE "public"."document_status" AS ENUM('DRAFT', 'POSTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('PURCHASE', 'SALE', 'TRANSFER', 'ADJUSTMENT', 'RETURN_IN', 'RETURN_OUT', 'PRODUCTION_IN', 'PRODUCTION_OUT', 'OPENING');--> statement-breakpoint
CREATE TYPE "public"."inbox_status" AS ENUM('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."movement_direction" AS ENUM('IN', 'OUT');--> statement-breakpoint
CREATE TABLE "business_partner_references" (
	"id" uuid PRIMARY KEY NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_references" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"base_currency_code" varchar(3) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currency_references" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" varchar(3) NOT NULL,
	"name" varchar(100) NOT NULL,
	"decimal_places" integer DEFAULT 2 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "currency_references_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "exchange_rate_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"rate" numeric(18, 8) NOT NULL,
	"effective_at" timestamp with time zone NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbox_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"source_service" varchar(50) NOT NULL,
	"aggregate_type" varchar(50),
	"aggregate_id" uuid,
	"payload" jsonb NOT NULL,
	"status" "inbox_status" DEFAULT 'PENDING' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"kafka_topic" varchar(150),
	"kafka_partition" integer,
	"kafka_offset" varchar(50),
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aggregate_type" varchar(50) NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" varchar(150) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "product_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"conversion_factor" numeric(18, 6) DEFAULT '1' NOT NULL,
	"is_purchase_unit" boolean DEFAULT true NOT NULL,
	"is_sales_unit" boolean DEFAULT true NOT NULL,
	"barcode" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"category_id" uuid,
	"sku" varchar(100) NOT NULL,
	"barcode" varchar(100),
	"name" varchar(255) NOT NULL,
	"description" text,
	"base_unit_id" uuid NOT NULL,
	"default_currency_id" uuid,
	"min_stock_level" numeric(18, 4) DEFAULT '0',
	"max_stock_level" numeric(18, 4),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stock_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(18, 4) DEFAULT '0' NOT NULL,
	"average_cost" numeric(18, 4) DEFAULT '0' NOT NULL,
	"last_movement_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"document_number" varchar(50) NOT NULL,
	"document_type" "document_type" NOT NULL,
	"status" "document_status" DEFAULT 'DRAFT' NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"target_warehouse_id" uuid,
	"partner_id" uuid,
	"currency_id" uuid NOT NULL,
	"exchange_rate" numeric(18, 8) DEFAULT '1' NOT NULL,
	"document_date" timestamp with time zone NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"line_number" integer DEFAULT 1 NOT NULL,
	"product_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"direction" "movement_direction" NOT NULL,
	"unit_id" uuid NOT NULL,
	"quantity" numeric(18, 4) NOT NULL,
	"base_quantity" numeric(18, 4) NOT NULL,
	"unit_price" numeric(18, 4) DEFAULT '0' NOT NULL,
	"currency_id" uuid NOT NULL,
	"exchange_rate" numeric(18, 8) DEFAULT '1' NOT NULL,
	"total_amount" numeric(18, 4) NOT NULL,
	"total_amount_base_currency" numeric(18, 4) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "unit_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "units_of_measure" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"unit_group_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_base_unit" boolean DEFAULT false NOT NULL,
	"factor_to_base" numeric(18, 6) DEFAULT '1' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(150) NOT NULL,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_company_id_company_references_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company_references"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parent_id_product_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."product_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_units" ADD CONSTRAINT "product_units_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_units" ADD CONSTRAINT "product_units_unit_id_units_of_measure_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units_of_measure"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_company_id_company_references_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company_references"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_base_unit_id_units_of_measure_id_fk" FOREIGN KEY ("base_unit_id") REFERENCES "public"."units_of_measure"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_default_currency_id_currency_references_id_fk" FOREIGN KEY ("default_currency_id") REFERENCES "public"."currency_references"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_company_id_company_references_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company_references"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_last_movement_id_stock_movements_id_fk" FOREIGN KEY ("last_movement_id") REFERENCES "public"."stock_movements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_documents" ADD CONSTRAINT "stock_documents_company_id_company_references_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company_references"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_documents" ADD CONSTRAINT "stock_documents_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_documents" ADD CONSTRAINT "stock_documents_target_warehouse_id_warehouses_id_fk" FOREIGN KEY ("target_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_documents" ADD CONSTRAINT "stock_documents_partner_id_business_partner_references_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."business_partner_references"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_documents" ADD CONSTRAINT "stock_documents_currency_id_currency_references_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency_references"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_company_id_company_references_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company_references"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_document_id_stock_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."stock_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_unit_id_units_of_measure_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units_of_measure"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_currency_id_currency_references_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency_references"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_groups" ADD CONSTRAINT "unit_groups_company_id_company_references_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company_references"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units_of_measure" ADD CONSTRAINT "units_of_measure_company_id_company_references_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company_references"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units_of_measure" ADD CONSTRAINT "units_of_measure_unit_group_id_unit_groups_id_fk" FOREIGN KEY ("unit_group_id") REFERENCES "public"."unit_groups"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_company_id_company_references_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company_references"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_partner_ref_company" ON "business_partner_references" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_exrate_ref_company_currency" ON "exchange_rate_references" USING btree ("company_id","currency_code");--> statement-breakpoint
CREATE INDEX "idx_inbox_status_received" ON "inbox_events" USING btree ("status","received_at");--> statement-breakpoint
CREATE INDEX "idx_outbox_unpublished" ON "outbox_events" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_category_company" ON "product_categories" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_product_unit" ON "product_units" USING btree ("product_id","unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_product_company_sku" ON "products" USING btree ("company_id","sku");--> statement-breakpoint
CREATE INDEX "idx_product_company" ON "products" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_balance_warehouse_product" ON "stock_balances" USING btree ("warehouse_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_document_company_number" ON "stock_documents" USING btree ("company_id","document_number");--> statement-breakpoint
CREATE INDEX "idx_document_company_date" ON "stock_documents" USING btree ("company_id","document_date");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_movement_document_line" ON "stock_movements" USING btree ("document_id","line_number");--> statement-breakpoint
CREATE INDEX "idx_movement_product_warehouse" ON "stock_movements" USING btree ("product_id","warehouse_id");--> statement-breakpoint
CREATE INDEX "idx_movement_company" ON "stock_movements" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_unit_group_company_name" ON "unit_groups" USING btree ("company_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_unit_company_code" ON "units_of_measure" USING btree ("company_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_warehouse_company_code" ON "warehouses" USING btree ("company_id","code");