export class SearchProductsQuery {
  constructor(
    public readonly companyId: string,
    public readonly term: string,
    public readonly isActive?: boolean,
  ) {}
}
