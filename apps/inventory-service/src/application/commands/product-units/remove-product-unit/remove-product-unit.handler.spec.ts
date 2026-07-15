import { ProductEntity } from "../../../../domain/entities/product.entity";
import { ProductUnitEntity } from "../../../../domain/entities/product-unit.entity";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IProductUnitRepository } from "../../../../domain/repositories/product-unit.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import { RemoveProductUnitCommand } from "./remove-product-unit.command";
import { RemoveProductUnitHandler } from "./remove-product-unit.handler";

describe("RemoveProductUnitHandler", () => {
  const actor = { allowsCompany: () => true, userId: () => null };
  const baseUnitId = crypto.randomUUID();

  it("prevents removing the base unit from product units", async () => {
    const entity = new ProductEntity({
      id: crypto.randomUUID(), companyId: crypto.randomUUID(), sku: "SKU-1",
      barcode: null, name: "Product", description: null,
      baseUnitId, categoryId: null, defaultCurrencyId: null,
      minStockLevel: "0", maxStockLevel: null, isActive: true, createdAt: new Date(),
    });
    const existing = new ProductUnitEntity(
      crypto.randomUUID(), entity.id, baseUnitId, "1.000000", true, true, null, new Date(),
    );
    const products: jest.Mocked<IProductRepository> = {
      findById: jest.fn().mockResolvedValue(entity), findByIdForUpdate: jest.fn(),
      findBySku: jest.fn(), findByBarcode: jest.fn(), list: jest.fn(),
      lockCompanyProducts: jest.fn(), hasMovements: jest.fn(),
      save: jest.fn(), update: jest.fn(),
    };
    const productUnits: jest.Mocked<IProductUnitRepository> = {
      findById: jest.fn().mockResolvedValue(existing), findByProductAndUnit: jest.fn(),
      listByProduct: jest.fn(), lockProductUnits: jest.fn(),
      save: jest.fn(), update: jest.fn(), delete: jest.fn(),
    };
    const unitOfWork = {
      run: jest.fn(async <T>(work: () => Promise<T>) => work()),
    } satisfies IUnitOfWorkPort;
    const handler = new RemoveProductUnitHandler(products, productUnits, unitOfWork, actor);
    const result = await handler.execute(new RemoveProductUnitCommand(existing.id));
    expect(result.isFailure).toBe(true);
    result.match(
      () => { throw new Error("expected failure"); },
      (error) => expect(error.code).toBe("BASE_UNIT_CANNOT_BE_REMOVED"),
    );
    expect(productUnits.delete).not.toHaveBeenCalled();
  });
});
