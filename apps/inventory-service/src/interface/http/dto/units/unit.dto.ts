import { z } from "zod";

const factorSchema = z.string().regex(/^\d{1,12}(?:\.\d{1,6})?$/)
  .refine((value) => Number(value) > 0, "Must be greater than zero");

export const createUnitGroupSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
});
export const updateUnitGroupSchema = z.object({ name: z.string().trim().min(1).max(100) });
export const createUnitSchema = z.object({
  companyId: z.string().uuid(), unitGroupId: z.string().uuid(),
  code: z.string().trim().min(1).max(20), name: z.string().trim().min(1).max(100),
  isBaseUnit: z.boolean().default(false), factorToBase: factorSchema.default("1"),
});
export const updateUnitSchema = z.object({ name: z.string().trim().min(1).max(100) });
export const conversionFactorSchema = z.object({ factorToBase: factorSchema });
export const companyQuerySchema = z.object({ companyId: z.string().uuid() });
export const unitListQuerySchema = companyQuerySchema.extend({ unitGroupId: z.string().uuid().optional() });

export type CreateUnitGroupDto = z.infer<typeof createUnitGroupSchema>;
export type UpdateUnitGroupDto = z.infer<typeof updateUnitGroupSchema>;
export type CreateUnitDto = z.infer<typeof createUnitSchema>;
export type UpdateUnitDto = z.infer<typeof updateUnitSchema>;
export type ConversionFactorDto = z.infer<typeof conversionFactorSchema>;
export type CompanyQueryDto = z.infer<typeof companyQuerySchema>;
export type UnitListQueryDto = z.infer<typeof unitListQuerySchema>;
