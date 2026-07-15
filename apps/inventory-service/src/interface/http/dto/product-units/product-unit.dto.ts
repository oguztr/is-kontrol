import { z } from 'zod';

const conversionFactorSchema = z
  .string()
  .regex(
    /^\d{1,12}(?:\.\d{1,6})?$/,
    'Must be a non-negative decimal with at most 12 integer and 6 decimal digits',
  )
  .refine((value) => Number(value) > 0, { message: 'Must be greater than zero' });

export const addProductUnitSchema = z.object({
  unitId: z.string().uuid(),
  conversionFactor: conversionFactorSchema.default('1'),
  isPurchaseUnit: z.boolean().default(true),
  isSalesUnit: z.boolean().default(true),
  barcode: z.string().trim().min(1).max(100).nullish().transform((value) => value ?? null),
});

export const updateProductUnitSchema = z.object({
  conversionFactor: conversionFactorSchema.optional(),
  isPurchaseUnit: z.boolean().optional(),
  isSalesUnit: z.boolean().optional(),
  barcode: z.string().trim().min(1).max(100).nullish(),
});

export type AddProductUnitDto = z.infer<typeof addProductUnitSchema>;
export type UpdateProductUnitDto = z.infer<typeof updateProductUnitSchema>;
