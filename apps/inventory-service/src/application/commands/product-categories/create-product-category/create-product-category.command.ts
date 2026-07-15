export class CreateProductCategoryCommand {
  constructor(
    public readonly companyId: string,
    public readonly name: string,
    public readonly parentId: string | null = null,
  ) {}
}
