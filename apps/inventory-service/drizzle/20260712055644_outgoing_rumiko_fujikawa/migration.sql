ALTER TABLE "outbox_events" ADD COLUMN "claimed_by" varchar(100);--> statement-breakpoint
ALTER TABLE "outbox_events" ADD COLUMN "claimed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "outbox_events" ADD COLUMN "attempt_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "outbox_events" ADD COLUMN "last_error" text;