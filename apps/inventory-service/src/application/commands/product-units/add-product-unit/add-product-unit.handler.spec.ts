import { ProductEntity } from "../../../../domain/entities/product.entity";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IProductDependencyRepository } from "../../../../domain/repositories/product-dependency.repository.interface";
import type { IProductUnitRepository } from "../../../../domain/repositories/product-unit.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import { AddProductUnitCommand } from "./add-product-unit.command";
import { AddProductUnitHandler } from "./add-product-unit.handler";

describe("AddProductUnitHandler", () => {
  const actor = { allowsCompany: () => true, userId: () => null };
  const baseUnitId = crypto.randomUUID();
  const product = () => new ProductEntity({
    id: crypto.randomUUID(), companyId: crypto.randomUUID(), sku: "SKU-1",
    barcode: null, name: "Product", description: null,
    baseUnitId, categoryId: null, defaultCurrencyId: null,
    minStockLevel: "0", maxStockLevel: null, isActive: true, createdAt: new Date(),
  });
  const productsRepository = (entity: ProductEntity): jest.Mocked<IProductRepository> => ({
    findById: jest.fn().mockResolvedValue(entity), findByIdForUpdate: jest.fn(), findBySku: jest.fn(),
    findByBarcode: jest.fn(), list: jest.fn(), lockCompanyProducts: jest.fn(),
    hasMovements: jest.fn(), save: jest.fn(), update: jest.fn(),
  });
  const productUnitsRepository = (): jest.Mocked<IProductUnitRepository> => ({
    findById: jest.fn(), findByProductAndUnit: jest.fn(), listByProduct: jest.fn(),
    lockProductUnits: jest.fn(), save: jest.fn(), update: jest.fn(), delete: jest.fn(),
  });
  const dependencies = {
    lockCategoryGraphShared: jest.fn(),
    unitBelongsToCompany: jest.fn().mockResolvedValue(true),
    categoryBelongsToCompany: jest.fn(),
  } satisfies IProductDependencyRepository;
  const unitOfWork = {
    run: jest.fn(async <T>(work: () => Promise<T>) => work()),
  } satisfies IUnitOfWorkPort;

  it("rejects adding the same unit twice", async () => {
    const entity = product();
    const products = productsRepository(entity);
    const productUnits = productUnitsRepository();
    productUnits.save.mockResolvedValue(false);
    const handler = new AddProductUnitHandler(
      products, dependencies, productUnits, unitOfWork, actor);
    const result = await handler.execute(new AddProductUnitCommand(
      entity.id, crypto.randomUUID(), "12", true, true, null));
    expect(result.isFailure).toBe(true);
    result.match(
      () => { throw new Error("expected failure"); },
      (error) => expect(error.code).toBe("PRODUCT_UNIT_ALREADY_EXISTS"),
    );
  });

  it("forces the base unit's conversion factor to one", async () => {
    const entity = product();
    const products = productsRepository(entity);
    const productUnits = productUnitsRepository();
    const handler = new AddProductUnitHandler(
      products, dependencies, productUnits, unitOfWork, actor);
    const result = await handler.execute(new AddProductUnitCommand(
      entity.id, baseUnitId, "12", true, true, null));
    expect(result.isFailure).toBe(true);
    result.match(
      () => { throw new Error("expected failure"); },
      (error) => expect(error.code).toBe("BASE_UNIT_FACTOR_MUST_BE_ONE"),
    );
    expect(productUnits.save).not.toHaveBeenCalled();
  });
});
