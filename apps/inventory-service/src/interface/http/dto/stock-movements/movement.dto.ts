import { z } from 'zod';

export const movementListQuerySchema = z.object({
  companyId: z.string().uuid(),
  productId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  partnerId: z.string().uuid().optional(),
  dateFrom: z.string().datetime({ offset: true }).transform((value) => new Date(value)).optional(),
  dateTo: z.string().datetime({ offset: true }).transform((value) => new Date(value)).optional(),
});

export type MovementListQueryDto = z.infer<typeof movementListQuerySchema>;

export const movementHistoryQuerySchema = z.object({
  dateFrom: z.string().datetime({ offset: true }).transform((value) => new Date(value)).optional(),
  dateTo: z.string().datetime({ offset: true }).transform((value) => new Date(value)).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
});

export type MovementHistoryQueryDto = z.infer<typeof movementHistoryQuerySchema>;
