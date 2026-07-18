import { z } from "zod";

const contactCoreSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(100).nullish(),
  department: z.string().trim().min(1).max(100).nullish(),
  phone: z.string().trim().min(3).max(30).nullish(),
  email: z.string().trim().email().max(255).nullish(),
});

export const addContactSchema = contactCoreSchema.extend({
  isPrimary: z.boolean().default(false),
});
export const updateContactSchema = contactCoreSchema;
export const contactSearchQuerySchema = z
  .object({
    companyId: z.string().uuid(),
    phone: z.string().trim().min(3).max(30).optional(),
    email: z.string().trim().email().max(255).optional(),
  })
  .refine((query) => query.phone !== undefined || query.email !== undefined, {
    message: "phone veya email kriterlerinden en az biri gerekli",
  });

export type AddContactDto = z.infer<typeof addContactSchema>;
export type UpdateContactDto = z.infer<typeof updateContactSchema>;
export type ContactSearchQueryDto = z.infer<typeof contactSearchQuerySchema>;
