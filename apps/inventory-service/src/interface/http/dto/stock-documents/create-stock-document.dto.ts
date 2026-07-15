import { z } from 'zod';

export const decimalSchema = (integerDigits: number, scale: number) =>
  z
    .string()
    .regex(
      new RegExp(`^\\d{1,${integerDigits}}(?:\\.\\d{1,${scale}})?$`),
      `Must be a non-negative decimal with at most ${integerDigits} integer and ${scale} decimal digits`,
    );

export const documentLineSchema = z.object({
  productId: z.string().uuid(),
  unitId: z.string().uuid(),
  quantity: decimalSchema(14, 4).refine((value) => Number(value) > 0, {
    message: 'Must be greater than zero',
  }),
  unitPrice: decimalSchema(14, 4).default('0'),
  notes: z.string().max(500).nullish(),
});

export const createStockDocumentSchema = z.object({
  companyId: z.string().uuid(),
  documentNumber: z.string().min(1).max(50),
  documentType: z.enum([
    'PURCHASE', 'SALE', 'TRANSFER', 'ADJUSTMENT', 'ADJUSTMENT_OUT',
    'RETURN_IN', 'RETURN_OUT', 'PRODUCTION_IN', 'PRODUCTION_OUT', 'OPENING',
  ]),
  warehouseId: z.string().uuid(),
  currencyId: z.string().uuid(),
  documentDate: z.string().datetime({ offset: true }).transform((value) => new Date(value)),
  lines: z.array(documentLineSchema).min(1),
  targetWarehouseId: z.string().uuid().nullish(),
  partnerId: z.string().uuid().nullish(),
  exchangeRate: decimalSchema(10, 8)
    .refine((value) => Number(value) > 0, {
      message: 'Must be greater than zero',
    })
    .default('1'),
  notes: z.string().max(2000).nullish(),
  createdBy: z.string().uuid().nullish(),
});

export type CreateStockDocumentDto = z.infer<typeof createStockDocumentSchema>;
