export class CreateUnitCommand {
  constructor(
    public readonly companyId: string,
    public readonly unitGroupId: string,
    public readonly code: string,
    public readonly name: string,
    public readonly isBaseUnit: boolean,
    public readonly factorToBase: string,
  ) {}
}
