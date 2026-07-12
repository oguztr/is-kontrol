export class ProductCategoryEntity {
  public parentId: string | null;
  public name: string;
  public deletedAt: Date | null;

  constructor(
    public readonly id: string,
    public readonly companyId: string,
    parentId: string | null,
    name: string,
    public readonly createdAt: Date,
    deletedAt: Date | null = null,
  ) {
    this.parentId = parentId;
    this.name = name;
    this.deletedAt = deletedAt;
  }

  update(name: string, parentId: string | null): void { this.name = name; this.parentId = parentId; }
  delete(at: Date): void { this.deletedAt = at; }
}
