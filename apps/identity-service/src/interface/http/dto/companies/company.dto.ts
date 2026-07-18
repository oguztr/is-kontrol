import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email())
  .pipe(z.string().max(255));
const passwordSchema = z.string().min(8).max(100);
const personNameSchema = z.string().trim().min(1).max(100);

export const signUpSchema = z.object({
  companyName: z.string().trim().min(1).max(255),
  baseCurrencyCode: z.string().length(3).default("TRY"),
  timezone: z.string().trim().min(1).max(50).default("Europe/Istanbul"),
  locale: z.string().trim().min(2).max(10).default("tr-TR"),
  email: emailSchema,
  password: passwordSchema,
  firstName: personNameSchema,
  lastName: personNameSchema,
});

export const updateCompanySchema = z.object({
  name: z.string().trim().min(1).max(255).nullish(),
  baseCurrencyCode: z.string().length(3).nullish(),
  timezone: z.string().trim().min(1).max(50).nullish(),
  locale: z.string().trim().min(2).max(10).nullish(),
});

export const companyQuerySchema = z.object({
  companyId: z.uuid(),
});

export type SignUpDto = z.infer<typeof signUpSchema>;
export type UpdateCompanyDto = z.infer<typeof updateCompanySchema>;
export type CompanyQueryDto = z.infer<typeof companyQuerySchema>;
