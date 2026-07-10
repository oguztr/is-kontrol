export class Quantity {
  public readonly value: string;
  public readonly unitId: string;

  constructor(value: string, unitId: string) {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      throw new Error(`Invalid quantity value: ${value}`);
    }
    this.value = parsed.toFixed(4);
    this.unitId = unitId;
  }

  convertToBase(factorToBase: string): Quantity {
    const base = (parseFloat(this.value) * parseFloat(factorToBase)).toFixed(4);
    // baseUnitId is resolved by the caller
    return new Quantity(base, this.unitId);
  }

  isGreaterThan(other: Quantity): boolean {
    if (this.unitId !== other.unitId) {
      throw new Error('Cannot compare quantities with different units');
    }
    return parseFloat(this.value) > parseFloat(other.value);
  }

  get isZero(): boolean {
    return parseFloat(this.value) === 0;
  }

  get isNegative(): boolean {
    return parseFloat(this.value) < 0;
  }
}
