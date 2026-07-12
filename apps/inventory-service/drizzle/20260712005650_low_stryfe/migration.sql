CREATE TABLE "processed_events" (
	"event_id" varchar(200) PRIMARY KEY,
	"event_type" varchar(100) NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "inbox_events";--> statement-breakpoint
DROP TYPE "inbox_status";