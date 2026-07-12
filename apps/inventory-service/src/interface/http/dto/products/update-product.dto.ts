import { z } from 'zod';

const stockLevelSchema = z
  .string()
  .regex(
    /^\d{1,14}(?:\.\d{1,4})?$/,
    'Must be a non-negative decimal with at most 14 integer and 4 decimal digits',
  );

export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullish(),
  categoryId: z.string().uuid().nullish(),
  defaultCurrencyId: z.string().uuid().nullish(),
  minStockLevel: stockLevelSchema.optional(),
  maxStockLevel: stockLevelSchema.nullish(),
});

export type UpdateProductDto = z.infer<typeof updateProductSchema>;
