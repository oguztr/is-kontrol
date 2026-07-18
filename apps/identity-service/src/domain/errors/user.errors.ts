export type UserError =
  | { code: 'USER_NOT_FOUND'; userId: string }
  | { code: 'EMAIL_ALREADY_IN_USE'; email: string }
  | { code: 'ROLE_NOT_FOUND'; roleId: string }
  | { code: 'INVITATION_NOT_FOUND'; invitationId: string }
  | { code: 'INVITATION_NOT_PENDING'; invitationId: string }
  | { code: 'INVITATION_EXPIRED'; invitationId: string }
  | { code: 'INVITATION_ALREADY_PENDING'; email: string }
  | { code: 'USER_LIMIT_REACHED'; companyId: string; maxUsers: number };

export const UserErrors = {
  notFound: (userId: string): UserError =>
    ({ code: 'USER_NOT_FOUND', userId }),

  emailAlreadyInUse: (email: string): UserError =>
    ({ code: 'EMAIL_ALREADY_IN_USE', email }),

  roleNotFound: (roleId: string): UserError =>
    ({ code: 'ROLE_NOT_FOUND', roleId }),

  invitationNotFound: (invitationId: string): UserError =>
    ({ code: 'INVITATION_NOT_FOUND', invitationId }),

  invitationNotPending: (invitationId: string): UserError =>
    ({ code: 'INVITATION_NOT_PENDING', invitationId }),

  invitationExpired: (invitationId: string): UserError =>
    ({ code: 'INVITATION_EXPIRED', invitationId }),

  invitationAlreadyPending: (email: string): UserError =>
    ({ code: 'INVITATION_ALREADY_PENDING', email }),

  userLimitReached: (companyId: string, maxUsers: number): UserError =>
    ({ code: 'USER_LIMIT_REACHED', companyId, maxUsers }),
};
