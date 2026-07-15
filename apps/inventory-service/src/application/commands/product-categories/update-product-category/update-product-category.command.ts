/* parentId değişimi taşıma (move) işlemini de kapsar; döngü kontrolü
 * handler'da yapılır. */
export class UpdateProductCategoryCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly parentId: string | null = null,
  ) {}
}
