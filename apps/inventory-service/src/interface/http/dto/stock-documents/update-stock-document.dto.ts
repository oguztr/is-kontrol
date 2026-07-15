import { z } from 'zod';
import { decimalSchema, documentLineSchema } from './create-stock-document.dto';

const documentTypeSchema = z.enum([
  'PURCHASE', 'SALE', 'TRANSFER', 'ADJUSTMENT', 'ADJUSTMENT_OUT',
  'RETURN_IN', 'RETURN_OUT', 'PRODUCTION_IN', 'PRODUCTION_OUT', 'OPENING',
]);

const exchangeRateSchema = decimalSchema(10, 8).refine(
  (value) => Number(value) > 0,
  { message: 'Must be greater than zero' },
);

export const updateStockDocumentSchema = z.object({
  documentDate: z.string().datetime({ offset: true }).transform((value) => new Date(value)).optional(),
  partnerId: z.string().uuid().nullish(),
  exchangeRate: exchangeRateSchema.optional(),
  notes: z.string().max(2000).nullish(),
});

export const addDocumentLineSchema = documentLineSchema;

export const updateDocumentLineSchema = z.object({
  productId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  quantity: decimalSchema(14, 4)
    .refine((value) => Number(value) > 0, { message: 'Must be greater than zero' })
    .optional(),
  unitPrice: decimalSchema(14, 4).optional(),
  notes: z.string().max(500).nullish(),
});

export const lineNumberParamSchema = z.coerce.number().int().positive();

export const stockDocumentListQuerySchema = z.object({
  companyId: z.string().uuid(),
  documentNumber: z.string().min(1).max(50).optional(),
  documentType: documentTypeSchema.optional(),
  status: z.enum(['DRAFT', 'POSTED', 'CANCELLED']).optional(),
  dateFrom: z.string().datetime({ offset: true }).transform((value) => new Date(value)).optional(),
  dateTo: z.string().datetime({ offset: true }).transform((value) => new Date(value)).optional(),
  partnerId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
});

export const documentNumberQuerySchema = z.object({ companyId: z.string().uuid() });

export type UpdateStockDocumentDto = z.infer<typeof updateStockDocumentSchema>;
export type AddDocumentLineDto = z.infer<typeof addDocumentLineSchema>;
export type UpdateDocumentLineDto = z.infer<typeof updateDocumentLineSchema>;
export type LineNumberParamDto = z.infer<typeof lineNumberParamSchema>;
export type StockDocumentListQueryDto = z.infer<typeof stockDocumentListQuerySchema>;
export type DocumentNumberQueryDto = z.infer<typeof documentNumberQuerySchema>;
