/* Kimlik doğrulama hataları. INVALID_CREDENTIALS bilerek ayrıntısızdır:
 * "e-posta yok" ile "şifre yanlış" ayrımı istemciye sızdırılmaz (hesap
 * enumeration'ı önlenir). */
export type AuthError =
  | { code: 'INVALID_CREDENTIALS' }
  | { code: 'USER_DEACTIVATED' }
  | { code: 'COMPANY_SUSPENDED' }
  | { code: 'INVALID_REFRESH_TOKEN' }
  | { code: 'REFRESH_TOKEN_REUSED' }
  | { code: 'INVALID_ONE_TIME_TOKEN' }
  | { code: 'CURRENT_PASSWORD_MISMATCH' };

export const AuthErrors = {
  invalidCredentials: (): AuthError => ({ code: 'INVALID_CREDENTIALS' }),
  userDeactivated: (): AuthError => ({ code: 'USER_DEACTIVATED' }),
  companySuspended: (): AuthError => ({ code: 'COMPANY_SUSPENDED' }),
  invalidRefreshToken: (): AuthError => ({ code: 'INVALID_REFRESH_TOKEN' }),
  refreshTokenReused: (): AuthError => ({ code: 'REFRESH_TOKEN_REUSED' }),
  invalidOneTimeToken: (): AuthError => ({ code: 'INVALID_ONE_TIME_TOKEN' }),
  currentPasswordMismatch: (): AuthError =>
    ({ code: 'CURRENT_PASSWORD_MISMATCH' }),
};
