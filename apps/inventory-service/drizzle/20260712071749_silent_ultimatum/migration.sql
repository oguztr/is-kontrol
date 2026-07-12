ALTER TABLE "products" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
WITH ranked_barcodes AS (
  SELECT "id", row_number() OVER (
    PARTITION BY "company_id", "barcode" ORDER BY "created_at", "id"
  ) AS rn
  FROM "products"
  WHERE "barcode" IS NOT NULL AND "deleted_at" IS NULL
)
UPDATE "products" SET "barcode" = NULL
WHERE "id" IN (SELECT "id" FROM ranked_barcodes WHERE rn > 1);--> statement-breakpoint
CREATE UNIQUE INDEX "uq_product_company_barcode" ON "products" ("company_id","barcode") WHERE "barcode" IS NOT NULL AND "deleted_at" IS NULL;
