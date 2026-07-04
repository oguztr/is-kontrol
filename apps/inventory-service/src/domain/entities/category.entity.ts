export class CategoryEntity {
  constructor(
    public readonly id: string,
    public name: string,
    public parentId: string | null
  ) {}
}
