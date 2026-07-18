import { createHash, randomBytes } from "node:crypto";

/* Opak token üretimi (refresh/davet/reset): istemciye giden değer 32 baytlık
 * rastgele base64url string'idir; DB'ye yalnız SHA-256 hex hash'i yazılır.
 * Doğrulama, gelen token'ın hash'i ile birebir eşleşme üzerinden yapılır. */
export interface OpaqueToken {
  token: string;
  tokenHash: string;
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function newOpaqueToken(): OpaqueToken {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: sha256Hex(token) };
}
