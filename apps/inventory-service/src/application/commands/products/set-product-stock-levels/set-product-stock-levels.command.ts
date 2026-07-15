export class SetProductStockLevelsCommand {
  constructor(
    public readonly id: string,
    public readonly minStockLevel: string,
    public readonly maxStockLevel: string | null = null,
  ) {}
}
