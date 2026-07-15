export class ListUnitsQuery {
  constructor(
    public readonly companyId: string,
    public readonly unitGroupId?: string,
  ) {}
}
