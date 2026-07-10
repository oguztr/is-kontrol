import { z } from 'zod';

const documentLineSchema = z.object({
  productId: z.string().uuid(),
  unitId: z.string().uuid(),
  quantity: z.string().regex(/^\d+(\.\d+)?$/),
  unitPrice: z.string().regex(/^\d+(\.\d+)?$/).default('0'),
  notes: z.string().max(500).nullish(),
});

export const createStockDocumentSchema = z.object({
  companyId: z.string().uuid(),
  documentNumber: z.string().min(1).max(50),
  documentType: z.enum([
    'PURCHASE', 'SALE', 'TRANSFER', 'ADJUSTMENT',
    'RETURN_IN', 'RETURN_OUT', 'PRODUCTION_IN', 'PRODUCTION_OUT', 'OPENING',
  ]),
  warehouseId: z.string().uuid(),
  currencyId: z.string().uuid(),
  documentDate: z.string().datetime(),
  lines: z.array(documentLineSchema).min(1),
  targetWarehouseId: z.string().uuid().nullish(),
  partnerId: z.string().uuid().nullish(),
  exchangeRate: z.string().regex(/^\d+(\.\d+)?$/).default('1'),
  notes: z.string().max(2000).nullish(),
  createdBy: z.string().uuid().nullish(),
});

export type CreateStockDocumentDto = z.infer<typeof createStockDocumentSchema>;
