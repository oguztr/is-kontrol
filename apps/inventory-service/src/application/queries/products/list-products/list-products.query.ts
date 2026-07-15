export class ListProductsQuery {
  constructor(
    public readonly companyId: string,
    public readonly categoryId?: string,
    public readonly isActive?: boolean,
    public readonly isArchived?: boolean,
    public readonly name?: string,
  ) {}
}
