import { ProductEntity } from "../../../../domain/entities/product.entity";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import { GetProductQuery } from "./get-product.query";
import { GetProductHandler } from "./get-product.handler";

describe("GetProductHandler", () => {
  it("hides another company's product from a scoped actor", async () => {
    const entity = new ProductEntity({
      id: crypto.randomUUID(), companyId: crypto.randomUUID(), sku: "SKU-1",
      barcode: null, name: "Product", description: null,
      baseUnitId: crypto.randomUUID(), categoryId: null, defaultCurrencyId: null,
      minStockLevel: "0", maxStockLevel: null, isActive: true, createdAt: new Date(),
    });
    const products: jest.Mocked<IProductRepository> = {
      findById: jest.fn().mockResolvedValue(entity),
      findByIdForUpdate: jest.fn(), findBySku: jest.fn(), findByBarcode: jest.fn(),
      list: jest.fn(), lockCompanyProducts: jest.fn(), hasMovements: jest.fn(),
      save: jest.fn(), update: jest.fn(),
    };
    const denyingActor = { allowsCompany: () => false, userId: () => null };
    const handler = new GetProductHandler(products, denyingActor);
    const result = await handler.execute(new GetProductQuery(entity.id));
    expect(result.isFailure).toBe(true);
  });
});
