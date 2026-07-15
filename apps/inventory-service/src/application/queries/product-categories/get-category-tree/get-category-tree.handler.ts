import { ProductCategoryErrors } from "../../../../domain/errors/product-category.errors";
import type { ProductCategoryError } from "../../../../domain/errors/product-category.errors";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IProductCategoryRepository } from "../../../../domain/repositories/product-category.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { GetCategoryTreeQuery } from "./get-category-tree.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export interface CategoryTreeNode {
  id: string;
  companyId: string;
  parentId: string | null;
  name: string;
  children: CategoryTreeNode[];
}

export class GetCategoryTreeHandler {
  constructor(
    private readonly categories: IProductCategoryRepository,
    private readonly companies: ICompanyReferenceRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetCategoryTreeQuery,
  ): Promise<Result<CategoryTreeNode[], ProductCategoryError>> {
    if (!this.actor.allowsCompany(query.companyId))
      return new Failure(ProductCategoryErrors.companyNotFound(query.companyId));
    const company = await this.companies.findById(query.companyId);
    if (!company)
      return new Failure(ProductCategoryErrors.companyNotFound(query.companyId));
    const categories = await this.categories.list(query.companyId);
    const nodes = new Map<string, CategoryTreeNode>(
      categories.map((category) => [
        category.id,
        {
          id: category.id,
          companyId: category.companyId,
          parentId: category.parentId,
          name: category.name,
          children: [],
        },
      ]),
    );
    const roots: CategoryTreeNode[] = [];
    for (const category of categories) {
      const node = nodes.get(category.id) as CategoryTreeNode;
      const parent = category.parentId
        ? nodes.get(category.parentId)
        : undefined;
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
    return new Success(roots);
  }
}
