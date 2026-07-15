import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import { ListStockMovementsQuery } from "./list-stock-movements.query";
import { ListStockMovementsHandler } from "./list-stock-movements.handler";

describe("ListStockMovementsHandler", () => {
  const actor = { allowsCompany: () => true, userId: () => null };
  const movements: jest.Mocked<IStockMovementRepository> = {
    findById: jest.fn(), findByDocumentId: jest.fn(), saveMany: jest.fn(),
    list: jest.fn().mockResolvedValue([]), hasPostedOpening: jest.fn(),
    replaceForDocument: jest.fn(), deleteByDocumentId: jest.fn(),
  };
  const companies = {
    findById: jest.fn(), upsert: jest.fn(), setActive: jest.fn(),
  } satisfies ICompanyReferenceRepository;
  const handler = new ListStockMovementsHandler(movements, companies, actor);

  it("fails when the company reference does not exist", async () => {
    companies.findById.mockResolvedValue(null);
    const result = await handler.execute(
      new ListStockMovementsQuery(crypto.randomUUID()));
    expect(result.isFailure).toBe(true);
    expect(movements.list).not.toHaveBeenCalled();
  });

  it("passes filters through to the repository", async () => {
    companies.findById.mockResolvedValue({
      id: "c", name: "Co", isActive: true, syncedAt: new Date(),
    });
    const query = new ListStockMovementsQuery(
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
      undefined,
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-12-31T00:00:00Z"),
    );
    const result = await handler.execute(query);
    expect(result.isSuccess).toBe(true);
    expect(movements.list).toHaveBeenCalledWith({
      companyId: query.companyId,
      productId: query.productId,
      warehouseId: query.warehouseId,
      partnerId: undefined,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
  });
});
