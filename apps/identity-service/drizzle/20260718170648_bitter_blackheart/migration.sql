CREATE TYPE "company_status" AS ENUM('ACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "one_time_token_purpose" AS ENUM('PASSWORD_RESET', 'EMAIL_VERIFICATION');--> statement-breakpoint
CREATE TYPE "permission_effect" AS ENUM('ALLOW', 'DENY');--> statement-breakpoint
CREATE TYPE "user_status" AS ENUM('ACTIVE', 'DEACTIVATED');--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"base_currency_code" varchar(3) DEFAULT 'TRY' NOT NULL,
	"timezone" varchar(50) DEFAULT 'Europe/Istanbul' NOT NULL,
	"locale" varchar(10) DEFAULT 'tr-TR' NOT NULL,
	"status" "company_status" DEFAULT 'ACTIVE'::"company_status" NOT NULL,
	"suspended_at" timestamp with time zone,
	"plan_tier" varchar(30) DEFAULT 'FREE' NOT NULL,
	"max_users" integer,
	"feature_flags" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"company_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"invited_by_user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "one_time_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"purpose" "one_time_token_purpose" NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"family_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"replaced_by_token_id" uuid,
	"user_agent" varchar(500),
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"company_id" uuid,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"permissions" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_permission_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"permission" varchar(100) NOT NULL,
	"effect" "permission_effect" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"company_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(30),
	"avatar_url" varchar(500),
	"status" "user_status" DEFAULT 'ACTIVE'::"user_status" NOT NULL,
	"email_verified_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "idx_companies_status" ON "companies" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_invitations_token_hash" ON "invitations" ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_invitations_pending_email" ON "invitations" ("company_id","email") WHERE "accepted_at" IS NULL AND "revoked_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_one_time_tokens_hash" ON "one_time_tokens" ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_one_time_tokens_user_purpose" ON "one_time_tokens" ("user_id","purpose");--> statement-breakpoint
CREATE INDEX "idx_outbox_unpublished" ON "outbox_events" ("published_at");--> statement-breakpoint
CREATE INDEX "idx_outbox_claimable" ON "outbox_events" ("published_at","claimed_at","created_at");--> statement-breakpoint
CREATE INDEX "idx_outbox_aggregate_order" ON "outbox_events" ("aggregate_type","aggregate_id","created_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_refresh_tokens_hash" ON "refresh_tokens" ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_family" ON "refresh_tokens" ("family_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_roles_system_code" ON "roles" ("code") WHERE "company_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_roles_company_code" ON "roles" ("company_id","code") WHERE "company_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_override_user_permission" ON "user_permission_overrides" ("user_id","permission");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_users_email" ON "users" ("email") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_users_company" ON "users" ("company_id");--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_company_id_companies_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_user_id_users_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "one_time_tokens" ADD CONSTRAINT "one_time_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_company_id_companies_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT;