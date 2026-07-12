import { Decimal } from "./decimal.vo";

export class Quantity {
  public readonly value: string;
  public readonly unitId: string;

  constructor(value: string, unitId: string) {
    this.value = Decimal.from(value).toFixed(4);
    this.unitId = unitId;
  }

  convertToBase(factorToBase: string): Quantity {
    const base = Decimal.from(this.value).multiply(Decimal.from(factorToBase));
    // baseUnitId is resolved by the caller
    return new Quantity(base.toFixed(4), this.unitId);
  }

  isGreaterThan(other: Quantity): boolean {
    if (this.unitId !== other.unitId) {
      throw new Error('Cannot compare quantities with different units');
    }
    return Decimal.from(this.value).isGreaterThan(Decimal.from(other.value));
  }

  get isZero(): boolean {
    return Decimal.from(this.value).isZero;
  }

  get isNegative(): boolean {
    return Decimal.from(this.value).isNegative;
  }
}
