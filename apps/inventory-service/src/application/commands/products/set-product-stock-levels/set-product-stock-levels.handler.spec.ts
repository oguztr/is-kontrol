import { ProductEntity } from "../../../../domain/entities/product.entity";
import type { IProductDependencyRepository } from "../../../../domain/repositories/product-dependency.repository.interface";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import { SetProductStockLevelsCommand } from "./set-product-stock-levels.command";
import { SetProductStockLevelsHandler } from "./set-product-stock-levels.handler";

describe("SetProductStockLevelsHandler", () => {
  const actor = { allowsCompany: () => true, userId: () => null };

  it("rejects a minimum stock level above the maximum", async () => {
    const entity = new ProductEntity({
      id: crypto.randomUUID(), companyId: crypto.randomUUID(), sku: "SKU-1",
      barcode: null, name: "Product", description: null,
      baseUnitId: crypto.randomUUID(), categoryId: null, defaultCurrencyId: null,
      minStockLevel: "1.0000", maxStockLevel: "10.0000",
      isActive: true, createdAt: new Date(),
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
    const handler = new SetProductStockLevelsHandler(
      products, dependencies, publisher, unitOfWork, actor);
    const result = await handler.execute(
      new SetProductStockLevelsCommand(entity.id, "20", "10"));
    expect(result.isFailure).toBe(true);
    expect(products.update).not.toHaveBeenCalled();
  });
});
