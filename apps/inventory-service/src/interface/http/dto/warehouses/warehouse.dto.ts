import { z } from "zod";

export const createWarehouseSchema = z.object({
  companyId: z.string().uuid(),
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(150),
  address: z.string().max(2000).nullish(),
});
export const updateWarehouseSchema = z.object({
  name: z.string().trim().min(1).max(150),
  address: z.string().max(2000).nullish(),
});
export const warehouseListQuerySchema = z.object({
  companyId: z.string().uuid(),
});
export type CreateWarehouseDto = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseDto = z.infer<typeof updateWarehouseSchema>;
export type WarehouseListQueryDto = z.infer<typeof warehouseListQuerySchema>;
