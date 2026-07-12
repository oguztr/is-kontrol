import { z } from "zod";

export const createCategorySchema = z.object({
  companyId: z.string().uuid(), name: z.string().trim().min(1).max(150),
  parentId: z.string().uuid().nullish(),
});
export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(150), parentId: z.string().uuid().nullish(),
});
export const categoryTreeQuerySchema = z.object({ companyId: z.string().uuid() });
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
export type CategoryTreeQueryDto = z.infer<typeof categoryTreeQuerySchema>;
