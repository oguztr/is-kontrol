import { z } from "zod";

const addressCoreSchema = z.object({
  type: z.enum(["BILLING", "SHIPPING", "HEADQUARTERS", "OTHER"]),
  label: z.string().trim().min(1).max(100).nullish(),
  line1: z.string().trim().min(1).max(255),
  line2: z.string().trim().min(1).max(255).nullish(),
  city: z.string().trim().min(1).max(100),
  district: z.string().trim().min(1).max(100).nullish(),
  postalCode: z.string().trim().min(1).max(20).nullish(),
  country: z.string().trim().min(1).max(100),
});

export const addAddressSchema = addressCoreSchema.extend({
  isDefault: z.boolean().default(false),
});
export const updateAddressSchema = addressCoreSchema;

export type AddAddressDto = z.infer<typeof addAddressSchema>;
export type UpdateAddressDto = z.infer<typeof updateAddressSchema>;
