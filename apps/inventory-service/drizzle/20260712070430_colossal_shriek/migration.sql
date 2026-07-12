WITH ranked_bases AS (
  SELECT "id", row_number() OVER (
    PARTITION BY "unit_group_id" ORDER BY "created_at", "id"
  ) AS rn
  FROM "units_of_measure"
  WHERE "is_base_unit" = true AND "deleted_at" IS NULL
)
UPDATE "units_of_measure" SET "is_base_unit" = false
WHERE "id" IN (SELECT "id" FROM ranked_bases WHERE rn > 1);--> statement-breakpoint
WITH first_active_units AS (
  SELECT DISTINCT ON (u."unit_group_id") u."id"
  FROM "units_of_measure" u
  WHERE u."is_active" = true
    AND u."deleted_at" IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM "units_of_measure" b
      WHERE b."unit_group_id" = u."unit_group_id"
        AND b."is_base_unit" = true
        AND b."deleted_at" IS NULL
    )
  ORDER BY u."unit_group_id", u."created_at", u."id"
)
UPDATE "units_of_measure"
SET "is_base_unit" = true, "factor_to_base" = '1'
WHERE "id" IN (SELECT "id" FROM first_active_units);--> statement-breakpoint
CREATE UNIQUE INDEX "uq_unit_group_base" ON "units_of_measure" ("unit_group_id") WHERE "is_base_unit" = true AND "deleted_at" IS NULL;
