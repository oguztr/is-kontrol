import type { IStockBalanceRepository } from "../../../../domain/repositories/stock-balance.repository.interface";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import { GetLowStockProductsQuery } from "./get-low-stock-products.query";
import { GetLowStockProductsHandler } from "./get-low-stock-products.handler";

describe("GetLowStockProductsHandler", () => {
  const actor = { allowsCompany: () => true, userId: () => null };

  it("fails threshold queries for an unknown company", async () => {
    const balances: jest.Mocked<IStockBalanceRepository> = {
      findByWarehouseAndProduct: jest.fn(), lockWarehouseAndProduct: jest.fn(),
      listByWarehouse: jest.fn(), listByProduct: jest.fn(),
      listBelowMinimum: jest.fn(), listAboveMaximum: jest.fn(),
      listOutOfStockProducts: jest.fn(), listNegative: jest.fn(),
      companySummary: jest.fn(), valuation: jest.fn(),
      findByWarehouseAndProductForUpdate: jest.fn(), saveOrUpdate: jest.fn(),
    };
    const companies = {
      findById: jest.fn().mockResolvedValue(null), upsert: jest.fn(), setActive: jest.fn(),
    } satisfies ICompanyReferenceRepository;
    const handler = new GetLowStockProductsHandler(balances, companies, actor);
    const result = await handler.execute(
      new GetLowStockProductsQuery(crypto.randomUUID()));
    expect(result.isFailure).toBe(true);
    expect(balances.listBelowMinimum).not.toHaveBeenCalled();
  });
});
