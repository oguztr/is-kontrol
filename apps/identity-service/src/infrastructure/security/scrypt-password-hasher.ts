import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { IPasswordHasherPort } from "../../application/ports/password-hasher.port";

/* Node yerleşik scrypt ile şifre hash'leme (native bağımlılık yok).
 * Format: scrypt$N$r$p$saltBase64$hashBase64 — parametreler hash'in içinde
 * taşındığı için ileride güçlendirilirse eski kayıtlar doğrulanmaya devam
 * eder. */
const KEY_LENGTH = 64;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

export class ScryptPasswordHasher implements IPasswordHasherPort {
  async hash(plain: string): Promise<string> {
    const salt = randomBytes(16);
    const key = await this.derive(plain, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P);
    return [
      "scrypt",
      SCRYPT_N,
      SCRYPT_R,
      SCRYPT_P,
      salt.toString("base64"),
      key.toString("base64"),
    ].join("$");
  }

  async verify(plain: string, storedHash: string): Promise<boolean> {
    const parts = storedHash.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const [, n, r, p, saltB64, keyB64] = parts;
    const expected = Buffer.from(keyB64, "base64");
    const actual = await this.derive(
      plain,
      Buffer.from(saltB64, "base64"),
      Number(n),
      Number(r),
      Number(p),
    );
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }

  private derive(
    plain: string,
    salt: Buffer,
    n: number,
    r: number,
    p: number,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(
        plain,
        salt,
        KEY_LENGTH,
        // maxmem varsayılanı (32MB) N=16384,r=8 için yetmez; payın üstünde tut.
        { N: n, r, p, maxmem: 128 * n * r * 2 },
        (error, derivedKey) => {
          if (error) reject(error);
          else resolve(derivedKey);
        },
      );
    });
  }
}
