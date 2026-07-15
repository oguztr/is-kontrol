ALTER TABLE "outbox_events" ADD COLUMN "correlation_id" varchar(100);--> statement-breakpoint
ALTER TABLE "stock_balances" ADD COLUMN "version" integer DEFAULT 0 NOT NULL;