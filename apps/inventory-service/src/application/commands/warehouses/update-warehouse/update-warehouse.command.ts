export class UpdateWarehouseCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly address: string | null = null,
  ) {}
}
