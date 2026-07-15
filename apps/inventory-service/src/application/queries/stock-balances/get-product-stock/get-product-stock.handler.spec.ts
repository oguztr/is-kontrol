import { ProductEntity } from "../../../../domain/entities/product.entity";
import { StockBalanceEntity } from "../../../../domain/entities/stock-balance.entity";
import type { IStockBalanceRepository } from "../../../../domain/repositories/stock-balance.repository.interface";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import { GetProductStockQuery } from "./get-product-stock.query";
import { GetProductStockHandler } from "./get-product-stock.handler";

describe("GetProductStockHandler", () => {
  const actor = { allowsCompany: () => true, userId: () => null };
  const companyId = crypto.randomUUID();
  const product = new ProductEntity({
    id: crypto.randomUUID(), companyId, sku: "SKU-1", barcode: null,
    name: "Ürün", description: null, baseUnitId: crypto.randomUUID(),
    categoryId: null, defaultCurrencyId: null,
    minStockLevel: "0", maxStockLevel: null, isActive: true, createdAt: new Date(),
  });
  const balance = (quantity: string, averageCost: string) =>
    new StockBalanceEntity({
      id: crypto.randomUUID(), companyId, warehouseId: crypto.randomUUID(),
      productId: product.id, quantity, averageCost,
      lastMovementId: null, updatedAt: new Date(),
    });

  it("sums quantities and values across warehouses for a product", async () => {
    const balances: jest.Mocked<IStockBalanceRepository> = {
      findByWarehouseAndProduct: jest.fn(), lockWarehouseAndProduct: jest.fn(),
      listByWarehouse: jest.fn(),
      listByProduct: jest.fn().mockResolvedValue([
        balance("5.0000", "10.0000"),
        balance("3.0000", "20.0000"),
      ]),
      listBelowMinimum: jest.fn(), listAboveMaximum: jest.fn(),
      listOutOfStockProducts: jest.fn(), listNegative: jest.fn(),
      companySummary: jest.fn(), valuation: jest.fn(),
      findByWarehouseAndProductForUpdate: jest.fn(), saveOrUpdate: jest.fn(),
    };
    const products = {
      findById: jest.fn().mockResolvedValue(product), findByIdForUpdate: jest.fn(),
      findBySku: jest.fn(), findByBarcode: jest.fn(), list: jest.fn(),
      lockCompanyProducts: jest.fn(), hasMovements: jest.fn(),
      save: jest.fn(), update: jest.fn(),
    } satisfies IProductRepository;
    const handler = new GetProductStockHandler(balances, products, actor);
    const result = await handler.execute(new GetProductStockQuery(product.id));
    result.match(
      (summary) => {
        expect(summary.totalQuantity).toBe("8.0000");
        expect(summary.totalValue).toBe("110.0000");
        expect(summary.balances).toHaveLength(2);
        expect(summary.balances[0].totalValue).toBe("50.0000");
      },
      () => { throw new Error("expected success"); },
    );
  });
});
