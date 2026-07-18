CREATE TYPE "address_type" AS ENUM('BILLING', 'SHIPPING', 'HEADQUARTERS', 'OTHER');--> statement-breakpoint
CREATE TYPE "note_type" AS ENUM('NOTE', 'CALL', 'MEETING', 'EMAIL');--> statement-breakpoint
CREATE TYPE "partner_kind" AS ENUM('INDIVIDUAL', 'CORPORATE');--> statement-breakpoint
CREATE TYPE "partner_status" AS ENUM('ACTIVE', 'PASSIVE', 'BLACKLISTED');--> statement-breakpoint
CREATE TYPE "partner_type" AS ENUM('CUSTOMER', 'SUPPLIER', 'BOTH');--> statement-breakpoint
CREATE TYPE "sales_funnel_stage" AS ENUM('LEAD', 'PROSPECT', 'CUSTOMER');--> statement-breakpoint
CREATE TABLE "company_references" (
	"id" uuid PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"base_currency_code" varchar(3) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"aggregate_type" varchar(50) NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"correlation_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"claimed_by" varchar(100),
	"claimed_at" timestamp with time zone,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_error" text
);
--> statement-breakpoint
CREATE TABLE "partner_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"partner_id" uuid NOT NULL,
	"kind" varchar(40) NOT NULL,
	"detail" jsonb DEFAULT '{}' NOT NULL,
	"actor_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"partner_id" uuid NOT NULL,
	"type" "address_type" NOT NULL,
	"label" varchar(100),
	"line1" varchar(255) NOT NULL,
	"line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"district" varchar(100),
	"postal_code" varchar(20),
	"country" varchar(100) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "partner_company_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"partner_id" uuid NOT NULL,
	"trade_name" varchar(255) NOT NULL,
	"tax_number" varchar(20),
	"tax_office" varchar(100),
	"industry" varchar(100),
	"website" varchar(255),
	"parent_partner_id" uuid,
	"payment_term_days" integer,
	"preferred_currency_code" varchar(3),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "partner_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"partner_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"title" varchar(100),
	"department" varchar(100),
	"phone" varchar(30),
	"email" varchar(255),
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "partner_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"partner_id" uuid NOT NULL,
	"type" "note_type" NOT NULL,
	"content" text NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"author_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"company_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "partner_type" NOT NULL,
	"kind" "partner_kind" NOT NULL,
	"status" "partner_status" DEFAULT 'ACTIVE'::"partner_status" NOT NULL,
	"sales_funnel_stage" "sales_funnel_stage",
	"assigned_user_id" uuid,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"merged_into_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "processed_events" (
	"event_id" varchar(200) PRIMARY KEY,
	"event_type" varchar(100) NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_outbox_unpublished" ON "outbox_events" ("published_at");--> statement-breakpoint
CREATE INDEX "idx_outbox_claimable" ON "outbox_events" ("published_at","claimed_at","created_at");--> statement-breakpoint
CREATE INDEX "idx_outbox_aggregate_order" ON "outbox_events" ("aggregate_type","aggregate_id","created_at","id");--> statement-breakpoint
CREATE INDEX "idx_activities_partner" ON "partner_activities" ("partner_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_addresses_partner" ON "partner_addresses" ("partner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_company_profile_partner" ON "partner_company_profiles" ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_company_profile_tax_number" ON "partner_company_profiles" ("tax_number");--> statement-breakpoint
CREATE INDEX "idx_contacts_partner" ON "partner_contacts" ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_contacts_email" ON "partner_contacts" ("email");--> statement-breakpoint
CREATE INDEX "idx_contacts_phone" ON "partner_contacts" ("phone");--> statement-breakpoint
CREATE INDEX "idx_notes_partner" ON "partner_notes" ("partner_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_partners_company" ON "partners" ("company_id");--> statement-breakpoint
CREATE INDEX "idx_partners_company_status" ON "partners" ("company_id","status");--> statement-breakpoint
CREATE INDEX "idx_partners_name" ON "partners" ("company_id","name");