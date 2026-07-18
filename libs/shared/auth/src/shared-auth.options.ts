export const SHARED_AUTH_OPTIONS = Symbol('SHARED_AUTH_OPTIONS');

export interface SharedAuthOptions {
  /** Identity servisinin imza public key'i, SPKI PEM formatında
   *  ("-----BEGIN PUBLIC KEY-----..."). Env'den verilir; private key
   *  SADECE identity-service'te bulunur. */
  publicKeyPem: string;
  /** Varsayılan RS256. */
  algorithm?: 'RS256' | 'ES256';
  /** Verilirse token'daki iss/aud claim'leri de doğrulanır. */
  issuer?: string;
  audience?: string;
}
