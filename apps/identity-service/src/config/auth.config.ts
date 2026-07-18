/* JWT imza anahtarları env'de base64'lenmiş PEM olarak taşınır (çok satırlı
 * PEM'in env dosyalarında kaçış sorunu yaşamaması için). Private key SADECE
 * bu serviste bulunur; diğer servisler yalnız public key ile doğrular. */
function decodePemFromEnv(name: string): string {
  const encoded = process.env[name];
  if (encoded) return Buffer.from(encoded, "base64").toString("utf8");
  if (process.env.NODE_ENV === "test") return "";
  throw new Error(`${name} is required`);
}

export const authConfig = {
  privateKeyPem: decodePemFromEnv("JWT_PRIVATE_KEY_BASE64"),
  publicKeyPem: decodePemFromEnv("JWT_PUBLIC_KEY_BASE64"),
  issuer: process.env.JWT_ISSUER ?? "identity-service",
  audience: process.env.JWT_AUDIENCE ?? "is-kontrol",
  accessTokenTtlSeconds: 15 * 60,
  refreshTokenTtlDays: 30,
  invitationTtlHours: 72,
  passwordResetTtlMinutes: 60,
} as const;

export type AuthConfig = typeof authConfig;
