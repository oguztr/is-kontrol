import { ProductEntity } from "../../../../domain/entities/product.entity";
import type { IProductDependencyRepository } from "../../../../domain/repositories/product-dependency.repository.interface";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import { DeleteProductCommand } from "./delete-product.command";
import { DeleteProductHandler } from "./delete-product.handler";

describe("DeleteProductHandler", () => {
  const actor = { allowsCompany: () => true, userId: () => null };
  const entity = new ProductEntity({
    id: crypto.randomUUID(), companyId: crypto.randomUUID(), sku: "SKU-1",
    barcode: null, name: "Product", description: null,
    baseUnitId: crypto.randomUUID(), categoryId: null, defaultCurrencyId: null,
    minStockLevel: "0", maxStockLevel: null, isActive: true, createdAt: new Date(),
  });
  const products: jest.Mocked<IProductRepository> = {
    findById: jest.fn().mockResolvedValue(entity),
    findByIdForUpdate: jest.fn().mockResolvedValue(entity),
    findBySku: jest.fn(), findByBarcode: jest.fn(), list: jest.fn(),
    lockCompanyProducts: jest.fn(),
    hasMovements: jest.fn().mockResolvedValue(true),
    save: jest.fn(), update: jest.fn(),
  };
  const dependencies = {
    lockCategoryGraphShared: jest.fn(), unitBelongsToCompany: jest.fn(),
    categoryBelongsToCompany: jest.fn(),
  } satisfies IProductDependencyRepository;
  const publisher = { publish: jest.fn() } satisfies IEventPublisherPort;
  const unitOfWork = {
    run: jest.fn(async <T>(work: () => Promise<T>) => work()),
  } satisfies IUnitOfWorkPort;

  it("prevents deleting a product with stock movements", async () => {
    const handler = new DeleteProductHandler(
      products, dependencies, publisher, unitOfWork, actor);
    const result = await handler.execute(new DeleteProductCommand(entity.id));
    expect(result.isFailure).toBe(true);
    expect(products.update).not.toHaveBeenCalled();
    expect(entity.deletedAt).toBeNull();
  });
});
