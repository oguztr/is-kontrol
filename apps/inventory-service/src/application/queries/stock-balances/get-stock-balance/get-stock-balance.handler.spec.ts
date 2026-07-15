import { ProductEntity } from "../../../../domain/entities/product.entity";
import { WarehouseEntity } from "../../../../domain/entities/warehouse.entity";
import type { IStockBalanceRepository } from "../../../../domain/repositories/stock-balance.repository.interface";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IWarehouseRepository } from "../../../../domain/repositories/warehouse.repository.interface";
import { GetStockBalanceQuery } from "./get-stock-balance.query";
import { GetStockBalanceHandler } from "./get-stock-balance.handler";

describe("GetStockBalanceHandler", () => {
  const actor = { allowsCompany: () => true, userId: () => null };
  const companyId = crypto.randomUUID();
  const product = new ProductEntity({
    id: crypto.randomUUID(), companyId, sku: "SKU-1", barcode: null,
    name: "Ürün", description: null, baseUnitId: crypto.randomUUID(),
    categoryId: null, defaultCurrencyId: null,
    minStockLevel: "0", maxStockLevel: null, isActive: true, createdAt: new Date(),
  });
  const warehouse = new WarehouseEntity({
    id: crypto.randomUUID(), companyId, code: "WH", name: "Depo",
    address: null, isActive: true, createdAt: new Date(),
  });

  it("returns a zero view for a warehouse-product pair with no balance", async () => {
    const balances: jest.Mocked<IStockBalanceRepository> = {
      findByWarehouseAndProduct: jest.fn().mockResolvedValue(null),
      lockWarehouseAndProduct: jest.fn(),
      listByWarehouse: jest.fn(), listByProduct: jest.fn(),
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
    const warehouses = {
      findById: jest.fn().mockResolvedValue(warehouse), findByCode: jest.fn(),
      list: jest.fn(), save: jest.fn(), update: jest.fn(), hasStock: jest.fn(),
    } satisfies IWarehouseRepository;
    const handler = new GetStockBalanceHandler(balances, products, warehouses, actor);
    const result = await handler.execute(
      new GetStockBalanceQuery(warehouse.id, product.id));
    expect(result.isSuccess).toBe(true);
    result.match(
      (view) => {
        expect(view.quantity).toBe("0.0000");
        expect(view.totalValue).toBe("0.0000");
        expect(view.lastMovementId).toBeNull();
      },
      () => { throw new Error("expected success"); },
    );
  });
});
