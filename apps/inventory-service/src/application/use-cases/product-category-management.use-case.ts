import { ProductCategoryEntity } from "../../domain/entities/product-category.entity";
import { ProductCategoryErrors } from "../../domain/errors/product-category.errors";
import type { ProductCategoryError } from "../../domain/errors/product-category.errors";
import type { ICompanyReferenceRepository } from "../../domain/repositories/company-reference.repository.interface";
import type { IProductCategoryRepository } from "../../domain/repositories/product-category.repository.interface";
import type { IUnitOfWorkPort } from "../ports/unit-of-work.port";
import { Failure, Result, Success } from "../result";

export interface CategoryTreeNode {
  id: string; companyId: string; parentId: string | null; name: string;
  children: CategoryTreeNode[];
}

export class ProductCategoryManagementUseCase {
  constructor(
    private readonly categories: IProductCategoryRepository,
    private readonly companies: ICompanyReferenceRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
  ) {}

  async create(companyId: string, name: string, parentId: string | null): Promise<Result<{ id: string }, ProductCategoryError>> {
    const outcome = await this.unitOfWork.run<{ id: string } | ProductCategoryError>(async () => {
      const company = await this.companies.findById(companyId);
      if (!company) return ProductCategoryErrors.companyNotFound(companyId);
      if (!company.isActive) return ProductCategoryErrors.companyInactive(companyId);
      await this.categories.lockCompanyGraph(companyId);
      if (parentId) {
        const parent = await this.categories.findById(parentId);
        if (!parent || parent.companyId !== companyId) return ProductCategoryErrors.notFound(parentId);
      }
      const category = new ProductCategoryEntity(
        crypto.randomUUID(), companyId, parentId, name, new Date(),
      );
      await this.categories.save(category);
      return { id: category.id };
    });
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }

  async update(id: string, name: string, parentId: string | null): Promise<Result<void, ProductCategoryError>> {
    const error = await this.unitOfWork.run<ProductCategoryError | undefined>(async () => {
      let category = await this.categories.findById(id);
      if (!category) return ProductCategoryErrors.notFound(id);
      await this.categories.lockCompanyGraph(category.companyId);
      category = await this.categories.findById(id);
      if (!category) return ProductCategoryErrors.notFound(id);
      const cycleError = await this.validateParent(category, parentId);
      if (cycleError) return cycleError;
      category.update(name, parentId);
      await this.categories.update(category);
      return undefined;
    });
    return error ? new Failure(error) : new Success(undefined);
  }

  async delete(id: string): Promise<Result<void, ProductCategoryError>> {
    const error = await this.unitOfWork.run<ProductCategoryError | undefined>(async () => {
      let category = await this.categories.findById(id);
      if (!category) return ProductCategoryErrors.notFound(id);
      await this.categories.lockCompanyGraph(category.companyId);
      category = await this.categories.findById(id);
      if (!category) return ProductCategoryErrors.notFound(id);
      await this.categories.detachProducts(id);
      await this.categories.reparentChildren(id, category.parentId);
      category.delete(new Date());
      await this.categories.update(category);
      return undefined;
    });
    return error ? new Failure(error) : new Success(undefined);
  }

  async tree(companyId: string): Promise<Result<CategoryTreeNode[], ProductCategoryError>> {
    const company = await this.companies.findById(companyId);
    if (!company) return new Failure(ProductCategoryErrors.companyNotFound(companyId));
    const categories = await this.categories.list(companyId);
    const nodes = new Map<string, CategoryTreeNode>(categories.map((category) => [
      category.id,
      {
        id: category.id, companyId: category.companyId, parentId: category.parentId,
        name: category.name, children: [],
      },
    ]));
    const roots: CategoryTreeNode[] = [];
    for (const category of categories) {
      const node = nodes.get(category.id) as CategoryTreeNode;
      const parent = category.parentId ? nodes.get(category.parentId) : undefined;
      if (parent) parent.children.push(node); else roots.push(node);
    }
    return new Success(roots);
  }

  async get(id: string): Promise<Result<ProductCategoryEntity, ProductCategoryError>> {
    const category = await this.categories.findById(id);
    return category ? new Success(category) : new Failure(ProductCategoryErrors.notFound(id));
  }

  private async validateParent(
    category: ProductCategoryEntity,
    parentId: string | null,
  ): Promise<ProductCategoryError | undefined> {
    if (!parentId) return undefined;
    if (parentId === category.id) return ProductCategoryErrors.cycle(category.id);
    const visited = new Set<string>([category.id]);
    let currentId: string | null = parentId;
    while (currentId) {
      if (visited.has(currentId)) return ProductCategoryErrors.cycle(category.id);
      visited.add(currentId);
      const current = await this.categories.findById(currentId);
      if (!current || current.companyId !== category.companyId) {
        return ProductCategoryErrors.notFound(currentId);
      }
      currentId = current.parentId;
    }
    return undefined;
  }
}
