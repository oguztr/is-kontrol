import { ProductEntity } from "../../../../domain/entities/product.entity";
import type { IProductDependencyRepository } from "../../../../domain/repositories/product-dependency.repository.interface";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import { DeactivateProductCommand } from "./deactivate-product.command";
import { DeactivateProductHandler } from "./deactivate-product.handler";

describe("DeactivateProductHandler", () => {
  it("hides another company's product from a scoped actor", async () => {
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
      lockCompanyProducts: jest.fn(), hasMovements: jest.fn(),
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
    const denyingActor = { allowsCompany: () => false, userId: () => null };
    const handler = new DeactivateProductHandler(
      products, dependencies, publisher, unitOfWork, denyingActor);
    const result = await handler.execute(new DeactivateProductCommand(entity.id));
    expect(result.isFailure).toBe(true);
    expect(products.update).not.toHaveBeenCalled();
    expect(entity.isActive).toBe(true);
  });
});
