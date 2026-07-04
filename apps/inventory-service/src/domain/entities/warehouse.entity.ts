export class WarehouseEntity {
  constructor(
    public readonly id: string,
    public name: string,
    public location: string,
    public isDefault: boolean
  ) {}
}
