import { z } from "zod";

const companyCreatedSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  baseCurrencyCode: z.string().length(3),
  isActive: z.boolean(),
  occurredAt: z.string().datetime({ offset: true }).transform((value) => new Date(value)),
});

const statusChangedSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
  occurredAt: z.string().datetime({ offset: true }).transform((value) => new Date(value)),
});

/* inventory-service'in product.* event'leri: created/updated aynı snapshot
 * sözleşmesini paylaşır, product_references cache'ini besler. */
const productSnapshotSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  sku: z.string().min(1).max(100),
  barcode: z.string().max(100).nullish(),
  name: z.string().min(1).max(255),
  isActive: z.boolean(),
  occurredAt: z.string().datetime({ offset: true }).transform((value) => new Date(value)),
});

const SCHEMAS: Readonly<Record<string, z.ZodType<Record<string, unknown>>>> = {
  "company.created": companyCreatedSchema,
  "company.updated": companyCreatedSchema,
  "company.activated": statusChangedSchema,
  "company.deactivated": statusChangedSchema,
  "product.created": productSnapshotSchema,
  "product.updated": productSnapshotSchema,
  "product.activated": statusChangedSchema,
  "product.deactivated": statusChangedSchema,
  "product.archived": statusChangedSchema,
  "product.deleted": statusChangedSchema,
};

export function parseConsumedEventPayload(
  eventType: string,
  payload: unknown,
): Record<string, unknown> {
  const schema = SCHEMAS[eventType];
  if (!schema) {
    throw new Error(`No consumed-event schema registered for ${eventType}`);
  }
  const parsed = schema.parse(payload);
  if (eventType.endsWith(".activated")) return { ...parsed, isActive: true };
  if (eventType.endsWith(".deactivated")) return { ...parsed, isActive: false };
  return parsed;
}
