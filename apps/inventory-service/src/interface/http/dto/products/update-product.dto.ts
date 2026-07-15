import { z } from 'zod';

const stockLevelSchema = z
  .string()
  .regex(
    /^\d{1,14}(?:\.\d{1,4})?$/,
    'Must be a non-negative decimal with at most 14 integer and 4 decimal digits',
  );

export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  barcode: z.string().trim().min(1).max(100).nullish(),
  description: z.string().max(2000).nullish(),
  categoryId: z.string().uuid().nullish(),
  defaultCurrencyId: z.string().uuid().nullish(),
  minStockLevel: stockLevelSchema.optional(),
  maxStockLevel: stockLevelSchema.nullish(),
});

export type UpdateProductDto = z.infer<typeof updateProductSchema>;

export const productListQuerySchema = z.object({
  companyId: z.string().uuid(), categoryId: z.string().uuid().optional(),
  isActive: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  isArchived: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  name: z.string().trim().min(1).max(255).optional(),
});
export const productLookupQuerySchema = z.object({ companyId: z.string().uuid() });
export const productSearchQuerySchema = z.object({
  companyId: z.string().uuid(),
  q: z.string().trim().min(1).max(255),
  isActive: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
});
export const changeBaseUnitSchema = z.object({ baseUnitId: z.string().uuid() });
export const stockLevelsSchema = z.object({
  minStockLevel: stockLevelSchema,
  maxStockLevel: stockLevelSchema.nullish(),
});
export type ProductListQueryDto = z.infer<typeof productListQuerySchema>;
export type ProductLookupQueryDto = z.infer<typeof productLookupQuerySchema>;
export type ProductSearchQueryDto = z.infer<typeof productSearchQuerySchema>;
export type ChangeBaseUnitDto = z.infer<typeof changeBaseUnitSchema>;
export type StockLevelsDto = z.infer<typeof stockLevelsSchema>;
