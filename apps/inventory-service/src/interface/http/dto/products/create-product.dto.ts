import { z } from 'zod';

export const createProductSchema = z.object({
  companyId: z.string().uuid(),
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  baseUnitId: z.string().uuid(),
  description: z.string().max(2000).nullish(),
  categoryId: z.string().uuid().nullish(),
  defaultCurrencyId: z.string().uuid().nullish(),
  minStockLevel: z.string().regex(/^\d+(\.\d+)?$/).default('0'),
  maxStockLevel: z.string().regex(/^\d+(\.\d+)?$/).nullish(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
