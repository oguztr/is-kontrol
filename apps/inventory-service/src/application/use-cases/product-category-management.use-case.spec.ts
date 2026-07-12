import { ProductCategoryEntity } from "../../domain/entities/product-category.entity";
import type { ICompanyReferenceRepository } from "../../domain/repositories/company-reference.repository.interface";
import type { IProductCategoryRepository } from "../../domain/repositories/product-category.repository.interface";
import type { IUnitOfWorkPort } from "../ports/unit-of-work.port";
import { ProductCategoryManagementUseCase } from "./product-category-management.use-case";

describe("ProductCategoryManagementUseCase", () => {
  const companyId = crypto.randomUUID();
  const parent = new ProductCategoryEntity(crypto.randomUUID(), companyId, null, "Parent", new Date());
  const child = new ProductCategoryEntity(crypto.randomUUID(), companyId, parent.id, "Child", new Date());
  const companies = {
    findById: jest.fn(), upsert: jest.fn(), setActive: jest.fn(),
  } satisfies ICompanyReferenceRepository;
  const unitOfWork = {
    run: jest.fn(async <T>(work: () => Promise<T>) => work()),
  } satisfies IUnitOfWorkPort;

  it("rejects assigning a category below its own descendant", async () => {
    const categories = {
      lockCompanyGraph: jest.fn(),
      findById: jest.fn(async (id: string) => id === parent.id ? parent : id === child.id ? child : null),
      list: jest.fn(), save: jest.fn(), update: jest.fn(),
      detachProducts: jest.fn(), reparentChildren: jest.fn(),
    } satisfies IProductCategoryRepository;
    const useCase = new ProductCategoryManagementUseCase(categories, companies, unitOfWork);
    const result = await useCase.update(parent.id, parent.name, child.id);
    expect(result.isFailure).toBe(true);
    expect(categories.update).not.toHaveBeenCalled();
  });

  it("detaches products and reparents children when deleting", async () => {
    const categories = {
      lockCompanyGraph: jest.fn(), findById: jest.fn().mockResolvedValue(child),
      list: jest.fn(), save: jest.fn(), update: jest.fn(),
      detachProducts: jest.fn(), reparentChildren: jest.fn(),
    } satisfies IProductCategoryRepository;
    const useCase = new ProductCategoryManagementUseCase(categories, companies, unitOfWork);
    const result = await useCase.delete(child.id);
    expect(result.isSuccess).toBe(true);
    expect(categories.detachProducts).toHaveBeenCalledWith(child.id);
    expect(categories.reparentChildren).toHaveBeenCalledWith(child.id, parent.id);
    expect(child.deletedAt).toBeInstanceOf(Date);
  });
});
