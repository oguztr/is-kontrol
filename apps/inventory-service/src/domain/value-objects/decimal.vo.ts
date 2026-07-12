const SCALE = 8;
const FACTOR = 10n ** BigInt(SCALE);

/**
 * Sabit noktalı ondalık sayı (iç ölçek: 8 basamak, BigInt tabanlı).
 * DB'deki numeric kolonlar string taşındığı için parasal/miktar hesapları
 * IEEE-754 float hatasına girmeden burada yapılır. Yuvarlama: half-up.
 */
export class Decimal {
  private constructor(private readonly units: bigint) {}

  static from(value: string): Decimal {
    const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value.trim());
    if (!match) {
      throw new Error(`Invalid decimal value: ${value}`);
    }
    const [, sign, whole, fraction = ""] = match;
    const frac = (fraction + "0".repeat(SCALE)).slice(0, SCALE);
    // SCALE'den uzun kesirler yarım-yukarı yuvarlanır
    const roundUp = fraction.length > SCALE && fraction.charCodeAt(SCALE) >= 53; // '5'
    let units = BigInt(whole) * FACTOR + BigInt(frac);
    if (roundUp) units += 1n;
    return new Decimal(sign === "-" ? -units : units);
  }

  static zero(): Decimal {
    return new Decimal(0n);
  }

  add(other: Decimal): Decimal {
    return new Decimal(this.units + other.units);
  }

  subtract(other: Decimal): Decimal {
    return new Decimal(this.units - other.units);
  }

  multiply(other: Decimal): Decimal {
    return new Decimal(Decimal.divideRounded(this.units * other.units, FACTOR));
  }

  divide(other: Decimal): Decimal {
    if (other.units === 0n) {
      throw new Error("Division by zero");
    }
    return new Decimal(Decimal.divideRounded(this.units * FACTOR, other.units));
  }

  isGreaterThan(other: Decimal): boolean {
    return this.units > other.units;
  }

  fits(precision: number, scale: number): boolean {
    const [whole] = this.toFixed(scale).replace("-", "").split(".");
    return whole.length <= precision - scale;
  }

  get isZero(): boolean {
    return this.units === 0n;
  }

  get isNegative(): boolean {
    return this.units < 0n;
  }

  get isPositive(): boolean {
    return this.units > 0n;
  }

  /** numeric(18, dp) kolonlarına yazılacak string; half-up yuvarlar. */
  toFixed(dp: number): string {
    const dropFactor = 10n ** BigInt(SCALE - dp);
    const rounded = Decimal.divideRounded(this.units, dropFactor);
    const abs = rounded < 0n ? -rounded : rounded;
    const scale = 10n ** BigInt(dp);
    const whole = abs / scale;
    const frac = (abs % scale).toString().padStart(dp, "0");
    const sign = rounded < 0n ? "-" : "";
    return dp > 0 ? `${sign}${whole}.${frac}` : `${sign}${whole}`;
  }

  // BigInt bölmesi sıfıra doğru kırpar; bu yardımcı yarım-yukarı yuvarlar.
  private static divideRounded(dividend: bigint, divisor: bigint): bigint {
    const negative = dividend < 0n !== divisor < 0n;
    const a = dividend < 0n ? -dividend : dividend;
    const b = divisor < 0n ? -divisor : divisor;
    const quotient = a / b;
    const remainder = a % b;
    const rounded = remainder * 2n >= b ? quotient + 1n : quotient;
    return negative ? -rounded : rounded;
  }
}
