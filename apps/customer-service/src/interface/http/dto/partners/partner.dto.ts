import { z } from "zod";

const partnerTypeSchema = z.enum(["CUSTOMER", "SUPPLIER", "BOTH"]);
const partnerKindSchema = z.enum(["INDIVIDUAL", "CORPORATE"]);
const partnerStatusSchema = z.enum(["ACTIVE", "PASSIVE", "BLACKLISTED"]);
const salesFunnelStageSchema = z.enum(["LEAD", "PROSPECT", "CUSTOMER"]);
const tagSchema = z.string().trim().min(1).max(50);

export const createPartnerSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().trim().min(1).max(255),
  type: partnerTypeSchema,
  kind: partnerKindSchema,
  assignedUserId: z.string().uuid().nullish(),
  tags: z.array(tagSchema).max(20).default([]),
  createdBy: z.string().uuid().nullish(),
});
export const updatePartnerSchema = z.object({
  name: z.string().trim().min(1).max(255),
});
export const expandPartnerTypeSchema = z.object({
  type: partnerTypeSchema,
});
export const changePartnerStatusSchema = z.object({
  status: partnerStatusSchema,
});
export const updateSalesFunnelStageSchema = z.object({
  stage: salesFunnelStageSchema,
});
export const assignPartnerSchema = z.object({
  assignedUserId: z.string().uuid().nullable(),
});
export const addPartnerTagSchema = z.object({
  tag: tagSchema,
});
export const mergePartnersSchema = z.object({
  sourcePartnerId: z.string().uuid(),
});
export const upsertCompanyProfileSchema = z.object({
  tradeName: z.string().trim().min(1).max(255),
  taxNumber: z.string().trim().min(1).max(20).nullish(),
  taxOffice: z.string().trim().min(1).max(100).nullish(),
  industry: z.string().trim().min(1).max(100).nullish(),
  website: z.string().trim().url().max(255).nullish(),
  parentPartnerId: z.string().uuid().nullish(),
  paymentTermDays: z.number().int().min(0).max(365).nullish(),
  preferredCurrencyCode: z.string().length(3).nullish(),
});
export const partnerListQuerySchema = z.object({
  companyId: z.string().uuid(),
  type: partnerTypeSchema.optional(),
  kind: partnerKindSchema.optional(),
  status: partnerStatusSchema.optional(),
  stage: salesFunnelStageSchema.optional(),
  assignedUserId: z.string().uuid().optional(),
  tag: tagSchema.optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
  search: z.string().trim().min(1).max(255).optional(),
});
export const companyQuerySchema = z.object({
  companyId: z.string().uuid(),
});

export type CreatePartnerDto = z.infer<typeof createPartnerSchema>;
export type UpdatePartnerDto = z.infer<typeof updatePartnerSchema>;
export type ExpandPartnerTypeDto = z.infer<typeof expandPartnerTypeSchema>;
export type ChangePartnerStatusDto = z.infer<typeof changePartnerStatusSchema>;
export type UpdateSalesFunnelStageDto = z.infer<typeof updateSalesFunnelStageSchema>;
export type AssignPartnerDto = z.infer<typeof assignPartnerSchema>;
export type AddPartnerTagDto = z.infer<typeof addPartnerTagSchema>;
export type MergePartnersDto = z.infer<typeof mergePartnersSchema>;
export type UpsertCompanyProfileDto = z.infer<typeof upsertCompanyProfileSchema>;
export type PartnerListQueryDto = z.infer<typeof partnerListQuerySchema>;
export type CompanyQueryDto = z.infer<typeof companyQuerySchema>;
