import { z } from 'zod';

export const valuationQuerySchema = z.object({
  companyId: z.string().uuid(),
  warehouseId: z.string().uuid().optional(),
});

export const stockCardQuerySchema = z.object({
  warehouseId: z.string().uuid().optional(),
  dateFrom: z.string().datetime({ offset: true }).transform((value) => new Date(value)).optional(),
  dateTo: z.string().datetime({ offset: true }).transform((value) => new Date(value)).optional(),
});

export const dashboardQuerySchema = z.object({ companyId: z.string().uuid() });

export type ValuationQueryDto = z.infer<typeof valuationQuerySchema>;
export type StockCardQueryDto = z.infer<typeof stockCardQuerySchema>;
export type DashboardQueryDto = z.infer<typeof dashboardQuerySchema>;
