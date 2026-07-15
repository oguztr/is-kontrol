import { StockDocumentEntity } from "../../../../domain/entities/stock-document.entity";
import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import { StockDocumentLineBuilder } from "../stock-document-line.builder";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import { DeleteStockDocumentCommand } from "./delete-stock-document.command";
import { DeleteStockDocumentHandler } from "./delete-stock-document.handler";

describe("DeleteStockDocumentHandler", () => {
  const actor = { allowsCompany: () => true, userId: () => null };

  it("deletes a draft together with its lines", async () => {
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
    const handler = new DeleteStockDocumentHandler(
      documents, movements, lineBuilder, unitOfWork, actor);
    const result = await handler.execute(new DeleteStockDocumentCommand(entity.id));
    expect(result.isSuccess).toBe(true);
    expect(movements.deleteByDocumentId).toHaveBeenCalledWith(entity.id);
    expect(documents.delete).toHaveBeenCalledWith(entity.id);
  });
});
