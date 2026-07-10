import { z } from 'zod';

export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullish(),
  categoryId: z.string().uuid().nullish(),
  defaultCurrencyId: z.string().uuid().nullish(),
  minStockLevel: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  maxStockLevel: z.string().regex(/^\d+(\.\d+)?$/).nullish(),
});

export type UpdateProductDto = z.infer<typeof updateProductSchema>;
