export class CreateUnitGroupCommand {
  constructor(
    public readonly companyId: string,
    public readonly name: string,
  ) {}
}
