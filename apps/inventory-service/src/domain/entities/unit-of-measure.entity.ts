export class UnitOfMeasureEntity {
  public name: string;
  public isBaseUnit: boolean;
  public factorToBase: string;
  public isActive: boolean;

  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly unitGroupId: string,
    public readonly code: string,
    name: string,
    isBaseUnit: boolean,
    factorToBase: string,
    isActive: boolean,
    public readonly createdAt: Date,
  ) {
    this.name = name;
    this.isBaseUnit = isBaseUnit;
    this.factorToBase = factorToBase;
    this.isActive = isActive;
  }

  update(name: string): void {
    this.name = name;
  }

  deactivate(): void {
    this.isActive = false;
  }

  makeBase(): void {
    this.isBaseUnit = true;
    this.factorToBase = "1.000000";
    this.isActive = true;
  }

  removeBase(): void {
    this.isBaseUnit = false;
  }

  setConversionFactor(factor: string): void {
    this.factorToBase = factor;
  }
}
