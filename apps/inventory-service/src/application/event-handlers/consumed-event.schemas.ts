import { z } from "zod";

const companyCreatedSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  baseCurrencyCode: z.string().length(3),
  isActive: z.boolean(),
  occurredAt: z.string().datetime({ offset: true }).transform((value) => new Date(value)),
});

const currencyCreatedSchema = z.object({
  id: z.string().uuid(),
  code: z.string().length(3),
  name: z.string().min(1).max(100),
  decimalPlaces: z.number().int().min(0).max(8),
  isActive: z.boolean(),
  occurredAt: z.string().datetime({ offset: true }).transform((value) => new Date(value)),
});

const businessPartnerCreatedSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  name: z.string().min(1).max(255),
  isActive: z.boolean(),
  occurredAt: z.string().datetime({ offset: true }).transform((value) => new Date(value)),
});

const statusChangedSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
  occurredAt: z.string().datetime({ offset: true }).transform((value) => new Date(value)),
});

const exchangeRateUpdatedSchema = z.object({
  id: z.string().uuid(), companyId: z.string().uuid(),
  currencyCode: z.string().length(3),
  rate: z.string().regex(/^\d{1,10}(?:\.\d{1,8})?$/),
  effectiveAt: z.string().datetime({ offset: true }).transform((value) => new Date(value)),
  occurredAt: z.string().datetime({ offset: true }).transform((value) => new Date(value)),
});

const businessPartnerSyncedSchema = businessPartnerCreatedSchema.extend({
  type: z.enum(["SUPPLIER", "CUSTOMER", "BOTH"]),
});

const SCHEMAS: Readonly<Record<string, z.ZodType<Record<string, unknown>>>> = {
  "company.created": companyCreatedSchema,
  "company.updated": companyCreatedSchema,
  "company.activated": statusChangedSchema,
  "company.deactivated": statusChangedSchema,
  "currency.created": currencyCreatedSchema,
  "currency.updated": currencyCreatedSchema,
  "currency.activated": statusChangedSchema,
  "currency.deactivated": statusChangedSchema,
  "exchange-rate.updated": exchangeRateUpdatedSchema,
  "supplier.created": businessPartnerCreatedSchema,
  "supplier.updated": businessPartnerCreatedSchema,
  "supplier.activated": statusChangedSchema,
  "supplier.deactivated": statusChangedSchema,
  "customer.created": businessPartnerCreatedSchema,
  "customer.updated": businessPartnerCreatedSchema,
  "customer.activated": statusChangedSchema,
  "customer.deactivated": statusChangedSchema,
  "business-partner.created": businessPartnerSyncedSchema,
  "business-partner.updated": businessPartnerSyncedSchema,
  "business-partner.activated": statusChangedSchema,
  "business-partner.deactivated": statusChangedSchema,
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
