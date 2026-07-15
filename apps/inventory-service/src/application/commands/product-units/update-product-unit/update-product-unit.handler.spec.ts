import { ProductEntity } from "../../../../domain/entities/product.entity";
import { ProductUnitEntity } from "../../../../domain/entities/product-unit.entity";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IProductUnitRepository } from "../../../../domain/repositories/product-unit.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import { UpdateProductUnitCommand } from "./update-product-unit.command";
import { UpdateProductUnitHandler } from "./update-product-unit.handler";

describe("UpdateProductUnitHandler", () => {
  const actor = { allowsCompany: () => true, userId: () => null };

  it("updates flags, factor and barcode of an alternative unit", async () => {
    const entity = new ProductEntity({
      id: crypto.randomUUID(), companyId: crypto.randomUUID(), sku: "SKU-1",
      barcode: null, name: "Product", description: null,
      baseUnitId: crypto.randomUUID(), categoryId: null, defaultCurrencyId: null,
      minStockLevel: "0", maxStockLevel: null, isActive: true, createdAt: new Date(),
    });
    const existing = new ProductUnitEntity(
      crypto.randomUUID(), entity.id, crypto.randomUUID(),
      "1.000000", true, true, null, new Date(),
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
    const handler = new UpdateProductUnitHandler(products, productUnits, unitOfWork, actor);
    const result = await handler.execute(new UpdateProductUnitCommand(
      existing.id, "24", false, undefined, "8690000000012"));
    expect(result.isSuccess).toBe(true);
    expect(existing.conversionFactor).toBe("24.000000");
    expect(existing.isPurchaseUnit).toBe(false);
    expect(existing.isSalesUnit).toBe(true);
    expect(existing.barcode).toBe("8690000000012");
    expect(productUnits.update).toHaveBeenCalledWith(existing);
  });
});
