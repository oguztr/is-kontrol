export class SearchContactsQuery {
  constructor(
    public readonly companyId: string,
    public readonly phone?: string,
    public readonly email?: string,
  ) {}
}
