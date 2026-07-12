import { z } from 'zod';

const stockLevelSchema = z
  .string()
  .regex(
    /^\d{1,14}(?:\.\d{1,4})?$/,
    'Must be a non-negative decimal with at most 14 integer and 4 decimal digits',
  );

export const createProductSchema = z.object({
  companyId: z.string().uuid(),
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  baseUnitId: z.string().uuid(),
  description: z.string().max(2000).nullish(),
  categoryId: z.string().uuid().nullish(),
  defaultCurrencyId: z.string().uuid().nullish(),
  minStockLevel: stockLevelSchema.default('0'),
  maxStockLevel: stockLevelSchema.nullish(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
