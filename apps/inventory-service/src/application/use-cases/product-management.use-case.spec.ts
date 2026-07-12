import { ProductEntity } from "../../domain/entities/product.entity";
import type { ICompanyReferenceRepository } from "../../domain/repositories/company-reference.repository.interface";
import type { ICurrencyReferenceRepository } from "../../domain/repositories/currency-reference.repository.interface";
import type { IProductDependencyRepository } from "../../domain/repositories/product-dependency.repository.interface";
import type { IProductRepository } from "../../domain/repositories/product.repository.interface";
import type { IEventPublisherPort } from "../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../ports/unit-of-work.port";
import { ProductManagementUseCase } from "./product-management.use-case";

describe("ProductManagementUseCase", () => {
  const product = () => new ProductEntity({
    id: crypto.randomUUID(), companyId: crypto.randomUUID(), sku: "SKU-1",
    barcode: "869000000001", name: "Product", description: null,
    baseUnitId: crypto.randomUUID(), categoryId: null, defaultCurrencyId: null,
    minStockLevel: "1.0000", maxStockLevel: "10.0000",
    isActive: true, createdAt: new Date(),
  });
  const repository = (entity: ProductEntity): jest.Mocked<IProductRepository> => ({
    findById: jest.fn().mockResolvedValue(entity), findByIdForUpdate: jest.fn().mockResolvedValue(entity), findBySku: jest.fn(),
    findByBarcode: jest.fn(), list: jest.fn(), lockCompanyProducts: jest.fn(),
    hasMovements: jest.fn(), save: jest.fn(), update: jest.fn(),
  });
  const dependencies = {
    lockCategoryGraphShared: jest.fn(), unitBelongsToCompany: jest.fn(), categoryBelongsToCompany: jest.fn(),
  } satisfies IProductDependencyRepository;
  const currencies = {
    findById: jest.fn(), findByCode: jest.fn(), upsert: jest.fn(), setActive: jest.fn(),
  } satisfies ICurrencyReferenceRepository;
  const companies = {
    findById: jest.fn(), upsert: jest.fn(), setActive: jest.fn(),
  } satisfies ICompanyReferenceRepository;
  const publisher = { publish: jest.fn() } satisfies IEventPublisherPort;
  const unitOfWork = {
    run: jest.fn(async <T>(work: () => Promise<T>) => work()),
  } satisfies IUnitOfWorkPort;

  it("prevents deleting a product with stock movements", async () => {
    const entity = product();
    const products = repository(entity);
    products.hasMovements.mockResolvedValue(true);
    const useCase = new ProductManagementUseCase(
      products, dependencies, currencies, companies, publisher, unitOfWork,
    );
    const result = await useCase.delete(entity.id);
    expect(result.isFailure).toBe(true);
    expect(products.update).not.toHaveBeenCalled();
    expect(entity.deletedAt).toBeNull();
  });

  it("rejects a minimum stock level above the maximum", async () => {
    const entity = product();
    const products = repository(entity);
    const useCase = new ProductManagementUseCase(
      products, dependencies, currencies, companies, publisher, unitOfWork,
    );
    const result = await useCase.setStockLevels(entity.id, "20", "10");
    expect(result.isFailure).toBe(true);
    expect(products.update).not.toHaveBeenCalled();
  });
});
