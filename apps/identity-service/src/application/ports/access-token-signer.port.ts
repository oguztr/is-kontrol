/* Claim şekli libs/shared/auth'taki AccessTokenPayload sözleşmesiyle
 * birebir aynıdır; diğer servislerin JwtAuthGuard'ı bu alanları bekler. */
export interface AccessTokenClaims {
  userId: string;
  companyId: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface SignedAccessToken {
  token: string;
  expiresInSeconds: number;
}

export interface IAccessTokenSignerPort {
  sign(claims: AccessTokenClaims): Promise<SignedAccessToken>;
}
