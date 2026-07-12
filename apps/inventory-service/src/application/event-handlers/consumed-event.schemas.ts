import { z } from "zod";

const companyCreatedSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  baseCurrencyCode: z.string().length(3),
});

const currencyCreatedSchema = z.object({
  id: z.string().uuid(),
  code: z.string().length(3),
  name: z.string().min(1).max(100),
  decimalPlaces: z.number().int().min(0).max(8),
});

const businessPartnerCreatedSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  name: z.string().min(1).max(255),
});

const SCHEMAS: Readonly<Record<string, z.ZodType<Record<string, unknown>>>> = {
  "company.created": companyCreatedSchema,
  "currency.created": currencyCreatedSchema,
  "supplier.created": businessPartnerCreatedSchema,
  "customer.created": businessPartnerCreatedSchema,
};

export function parseConsumedEventPayload(
  eventType: string,
  payload: unknown,
): Record<string, unknown> {
  const schema = SCHEMAS[eventType];
  if (!schema) {
    throw new Error(`No consumed-event schema registered for ${eventType}`);
  }
  return schema.parse(payload);
}
