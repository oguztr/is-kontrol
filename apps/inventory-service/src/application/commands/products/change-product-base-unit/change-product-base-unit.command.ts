export class ChangeProductBaseUnitCommand {
  constructor(
    public readonly id: string,
    public readonly baseUnitId: string,
  ) {}
}
