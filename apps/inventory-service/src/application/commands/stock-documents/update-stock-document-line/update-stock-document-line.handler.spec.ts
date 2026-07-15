import { StockDocumentEntity } from "../../../../domain/entities/stock-document.entity";
import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import { StockDocumentLineBuilder } from "../stock-document-line.builder";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import { UpdateStockDocumentLineCommand } from "./update-stock-document-line.command";
import { UpdateStockDocumentLineHandler } from "./update-stock-document-line.handler";

describe("UpdateStockDocumentLineHandler", () => {
  const actor = { allowsCompany: () => true, userId: () => null };

  it("returns LINE_NOT_FOUND when updating a missing line", async () => {
    const entity = new StockDocumentEntity({
      id: crypto.randomUUID(), companyId: crypto.randomUUID(),
      documentNumber: "DOC-1", documentType: "PURCHASE", status: "DRAFT",
      warehouseId: crypto.randomUUID(), targetWarehouseId: null, partnerId: null,
      currencyId: crypto.randomUUID(), exchangeRate: "1",
      documentDate: new Date(), notes: null, createdBy: null, createdAt: new Date(),
    });
    const documents: jest.Mocked<IStockDocumentRepository> = {
      findById: jest.fn().mockResolvedValue(entity),
      findByIdForUpdate: jest.fn().mockResolvedValue(entity),
      findByDocumentNumber: jest.fn(), list: jest.fn(),
      save: jest.fn(), update: jest.fn(), delete: jest.fn(),
    };
    const movements: jest.Mocked<IStockMovementRepository> = {
      findById: jest.fn(), findByDocumentId: jest.fn().mockResolvedValue([]),
      saveMany: jest.fn(), list: jest.fn(), hasPostedOpening: jest.fn(),
      replaceForDocument: jest.fn(), deleteByDocumentId: jest.fn(),
    };
    const lineBuilder = new StockDocumentLineBuilder(
      {
        findById: jest.fn(), findByIdForUpdate: jest.fn(), findBySku: jest.fn(),
        findByBarcode: jest.fn(), list: jest.fn(), lockCompanyProducts: jest.fn(),
        hasMovements: jest.fn(), save: jest.fn(), update: jest.fn(),
      },
      {
        findById: jest.fn(), findByProductAndUnit: jest.fn(), listByProduct: jest.fn(),
        lockProductUnits: jest.fn(), save: jest.fn(), update: jest.fn(), delete: jest.fn(),
      },
    );
    const unitOfWork = {
      run: jest.fn(async <T>(work: () => Promise<T>) => work()),
    } satisfies IUnitOfWorkPort;
    const handler = new UpdateStockDocumentLineHandler(
      documents, movements, lineBuilder, unitOfWork, actor);
    const result = await handler.execute(new UpdateStockDocumentLineCommand(
      entity.id, 5, undefined, undefined, "3"));
    result.match(
      () => { throw new Error("expected failure"); },
      (error) => expect(error.code).toBe("LINE_NOT_FOUND"),
    );
  });
});
