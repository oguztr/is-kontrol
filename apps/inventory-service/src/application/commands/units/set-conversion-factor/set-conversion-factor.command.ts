export class SetConversionFactorCommand {
  constructor(
    public readonly id: string,
    public readonly factorToBase: string,
  ) {}
}
