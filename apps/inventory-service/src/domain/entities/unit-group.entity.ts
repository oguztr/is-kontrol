export class UnitGroupEntity {
  public name: string;
  public deletedAt: Date | null;

  constructor(
    public readonly id: string,
    public readonly companyId: string,
    name: string,
    public readonly createdAt: Date,
    deletedAt: Date | null = null,
  ) {
    this.name = name;
    this.deletedAt = deletedAt;
  }

  rename(name: string): void {
    this.name = name;
  }

  delete(at: Date): void {
    this.deletedAt = at;
  }
}
