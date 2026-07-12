import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import { StockBalanceEntity } from "../../../../domain/entities/stock-balance.entity";
import { StockDocumentEntity } from "../../../../domain/entities/stock-document.entity";
import { StockMovementEntity } from "../../../../domain/entities/stock-movement.entity";
import type { IStockBalanceRepository } from "../../../../domain/repositories/stock-balance.repository.interface";
import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import { PostStockDocumentCommand } from "./post-stock-document.command";
import { PostStockDocumentHandler } from "./post-stock-document.handler";

describe("PostStockDocumentHandler", () => {
  const document = () =>
    new StockDocumentEntity({
      id: "00000000-0000-4000-8000-000000000001",
      companyId: "00000000-0000-4000-8000-000000000002",
      documentNumber: "DOC-1",
      documentType: "PURCHASE",
      status: "DRAFT",
      warehouseId: "00000000-0000-4000-8000-000000000003",
      targetWarehouseId: null,
      partnerId: null,
      currencyId: "00000000-0000-4000-8000-000000000004",
      exchangeRate: "1",
      documentDate: new Date("2026-07-12T00:00:00Z"),
      notes: null,
      createdBy: null,
      createdAt: new Date("2026-07-12T00:00:00Z"),
    });

  const movement = (warehouseId: string, productId: string) =>
    new StockMovementEntity({
      id: crypto.randomUUID(),
      companyId: "00000000-0000-4000-8000-000000000002",
      documentId: "00000000-0000-4000-8000-000000000001",
      lineNumber: 1,
      productId,
      warehouseId,
      direction: "IN",
      unitId: "00000000-0000-4000-8000-000000000005",
      quantity: "2.0000",
      baseQuantity: "2.0000",
      unitPrice: "5.0000",
      currencyId: "00000000-0000-4000-8000-000000000004",
      exchangeRate: "1.00000000",
      totalAmount: "10.0000",
      totalAmountBaseCurrency: "10.0000",
      notes: null,
      createdAt: new Date("2026-07-12T00:00:00Z"),
    });

  it("locks the document and missing balance key before applying movements", async () => {
    const currentDocument = document();
    const warehouseId = currentDocument.warehouseId;
    const productId = "00000000-0000-4000-8000-000000000006";
    const savedBalances: StockBalanceEntity[] = [];

    const documentRepository = {
      findById: jest.fn(),
      findByIdForUpdate: jest.fn().mockResolvedValue(currentDocument),
      findByDocumentNumber: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } satisfies IStockDocumentRepository;
    const movementRepository = {
      findByDocumentId: jest
        .fn()
        .mockResolvedValue([movement(warehouseId, productId)]),
      saveMany: jest.fn(),
    } satisfies IStockMovementRepository;
    const balanceRepository = {
      findByWarehouseAndProduct: jest.fn(),
      lockWarehouseAndProduct: jest.fn().mockResolvedValue(undefined),
      findByWarehouseAndProductForUpdate: jest.fn().mockResolvedValue(null),
      saveOrUpdate: jest.fn(async (balance: StockBalanceEntity) => {
        savedBalances.push(balance);
      }),
    } satisfies IStockBalanceRepository;
    const eventPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    } satisfies IEventPublisherPort;
    const unitOfWork = {
      run: jest.fn(async <T>(work: () => Promise<T>) => work()),
    } satisfies IUnitOfWorkPort;

    const handler = new PostStockDocumentHandler(
      documentRepository,
      movementRepository,
      balanceRepository,
      eventPublisher,
      unitOfWork,
    );

    const result = await handler.execute(
      new PostStockDocumentCommand(currentDocument.id),
    );
    expect(result.isSuccess).toBe(true);

    expect(documentRepository.findById).not.toHaveBeenCalled();
    expect(documentRepository.findByIdForUpdate).toHaveBeenCalledWith(
      currentDocument.id,
    );
    expect(balanceRepository.lockWarehouseAndProduct).toHaveBeenCalledWith(
      warehouseId,
      productId,
    );
    expect(savedBalances[0].quantity).toBe("2.0000");
    expect(currentDocument.status).toBe("POSTED");
    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
  });

  it("does not apply an already posted document", async () => {
    const currentDocument = document();
    currentDocument.post();
    const documentRepository = {
      findById: jest.fn(),
      findByIdForUpdate: jest.fn().mockResolvedValue(currentDocument),
      findByDocumentNumber: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } satisfies IStockDocumentRepository;
    const movementRepository = {
      findByDocumentId: jest.fn(),
      saveMany: jest.fn(),
    } satisfies IStockMovementRepository;
    const balanceRepository = {
      findByWarehouseAndProduct: jest.fn(),
      lockWarehouseAndProduct: jest.fn(),
      findByWarehouseAndProductForUpdate: jest.fn(),
      saveOrUpdate: jest.fn(),
    } satisfies IStockBalanceRepository;
    const eventPublisher = { publish: jest.fn() } satisfies IEventPublisherPort;
    const unitOfWork = {
      run: jest.fn(async <T>(work: () => Promise<T>) => work()),
    } satisfies IUnitOfWorkPort;
    const handler = new PostStockDocumentHandler(
      documentRepository,
      movementRepository,
      balanceRepository,
      eventPublisher,
      unitOfWork,
    );

    const result = await handler.execute(
      new PostStockDocumentCommand(currentDocument.id),
    );
    expect(result.isFailure).toBe(true);
    expect(
      result.match(
        () => null,
        (error) => error,
      ),
    ).toEqual({
      code: "DOCUMENT_ALREADY_POSTED",
      documentId: currentDocument.id,
    });
    expect(movementRepository.findByDocumentId).not.toHaveBeenCalled();
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });
});
