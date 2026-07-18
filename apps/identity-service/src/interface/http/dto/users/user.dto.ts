import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email())
  .pipe(z.string().max(255));
const personNameSchema = z.string().trim().min(1).max(100);
const phoneSchema = z.string().trim().min(3).max(30);

export const inviteUserSchema = z.object({
  companyId: z.uuid(),
  email: emailSchema,
  roleId: z.uuid(),
  invitedByUserId: z.uuid().nullish(),
});

export const acceptInvitationSchema = z.object({
  token: z.string().trim().min(1).max(200),
  password: z.string().min(8).max(100),
  firstName: personNameSchema,
  lastName: personNameSchema,
  phone: phoneSchema.nullish(),
});

export const updateUserProfileSchema = z.object({
  firstName: personNameSchema.nullish(),
  lastName: personNameSchema.nullish(),
  phone: phoneSchema.nullish(),
  avatarUrl: z.string().trim().url().max(500).nullish(),
});

export const assignRoleSchema = z.object({
  roleId: z.uuid(),
});

export type InviteUserDto = z.infer<typeof inviteUserSchema>;
export type AcceptInvitationDto = z.infer<typeof acceptInvitationSchema>;
export type UpdateUserProfileDto = z.infer<typeof updateUserProfileSchema>;
export type AssignRoleDto = z.infer<typeof assignRoleSchema>;
