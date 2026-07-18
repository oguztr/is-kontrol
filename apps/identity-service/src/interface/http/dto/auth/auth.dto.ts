import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email())
  .pipe(z.string().max(255));
const passwordSchema = z.string().min(8).max(100);
const opaqueTokenSchema = z.string().trim().min(1).max(200);

export const loginSchema = z.object({
  email: emailSchema,
  // Login'de mevcut şifre olduğu gibi denenir; min(8) yeni şifre kuralıdır.
  password: z.string().min(1).max(100),
});

export const refreshTokenSchema = z.object({
  refreshToken: opaqueTokenSchema,
});

export const logoutSchema = z.object({
  refreshToken: opaqueTokenSchema,
});

export const changePasswordSchema = z.object({
  // Guard'lar servislere bağlanana dek geçiş dönemi: kimlik x-user-id
  // başlığından, yoksa body'den alınır (diğer servislerdeki companyId gibi).
  userId: z.uuid(),
  currentPassword: z.string().min(1).max(100),
  newPassword: passwordSchema,
});

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: opaqueTokenSchema,
  newPassword: passwordSchema,
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type LogoutDto = z.infer<typeof logoutSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type RequestPasswordResetDto = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
