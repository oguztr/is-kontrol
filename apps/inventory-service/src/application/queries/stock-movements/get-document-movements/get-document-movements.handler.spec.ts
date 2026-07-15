import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import { GetDocumentMovementsQuery } from "./get-document-movements.query";
import { GetDocumentMovementsHandler } from "./get-document-movements.handler";

describe("GetDocumentMovementsHandler", () => {
  const actor = { allowsCompany: () => true, userId: () => null };
  const movements: jest.Mocked<IStockMovementRepository> = {
    findById: jest.fn(), findByDocumentId: jest.fn().mockResolvedValue([]),
    saveMany: jest.fn(), list: jest.fn(), hasPostedOpening: jest.fn(),
    replaceForDocument: jest.fn(), deleteByDocumentId: jest.fn(),
  };
  const documents: jest.Mocked<IStockDocumentRepository> = {
    findById: jest.fn(), findByIdForUpdate: jest.fn(), findByDocumentNumber: jest.fn(),
    list: jest.fn(), save: jest.fn(), update: jest.fn(), delete: jest.fn(),
  };
  const handler = new GetDocumentMovementsHandler(movements, documents, actor);

  it("fails when the document does not exist", async () => {
    documents.findById.mockResolvedValue(null);
    const result = await handler.execute(
      new GetDocumentMovementsQuery(crypto.randomUUID()));
    expect(result.isFailure).toBe(true);
    expect(movements.findByDocumentId).not.toHaveBeenCalled();
  });
});
