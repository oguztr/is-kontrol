import { StockDocumentEntity } from "../../../../domain/entities/stock-document.entity";
import type { DocumentStatus, DocumentType } from "../../../../domain/entities/stock-document.entity";
import { StockMovementEntity } from "../../../../domain/entities/stock-movement.entity";
import { StockBalanceEntity } from "../../../../domain/entities/stock-balance.entity";
import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import type { IStockBalanceRepository } from "../../../../domain/repositories/stock-balance.repository.interface";
import { StockBalanceEventsPublisher } from "../stock-balance-events.publisher";
import type { StockDocumentError } from "../../../../domain/errors/stock-document.errors";
import type { Result } from "@is-kontrol/shared-result";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import { CancelStockDocumentCommand } from "./cancel-stock-document.command";
import { CancelStockDocumentHandler } from "./cancel-stock-document.handler";

describe("CancelStockDocumentHandler", () => {
  const actor = { allowsCompany: () => true, userId: () => null };
  const document = (status: DocumentStatus, documentType: DocumentType = "PURCHASE") =>
    new StockDocumentEntity({
      id: crypto.randomUUID(), companyId: crypto.randomUUID(),
      documentNumber: "DOC-1", documentType, status,
      warehouseId: crypto.randomUUID(), targetWarehouseId: null, partnerId: null,
      currencyId: crypto.randomUUID(), exchangeRate: "1",
      documentDate: new Date(), notes: null, createdBy: null, createdAt: new Date(),
    });
  const movement = (doc: StockDocumentEntity, direction: "IN" | "OUT", baseQuantity: string) =>
    new StockMovementEntity({
      id: crypto.randomUUID(), companyId: doc.companyId, documentId: doc.id,
      lineNumber: 1, productId: crypto.randomUUID(), warehouseId: doc.warehouseId,
      direction, unitId: crypto.randomUUID(), quantity: baseQuantity,
      baseQuantity, unitPrice: "10.0000", currencyId: doc.currencyId,
      exchangeRate: "1.00000000", totalAmount: "10.0000",
      totalAmountBaseCurrency: "10.0000", notes: null, createdAt: new Date(),
    });
  const documentsRepository = (entity: StockDocumentEntity | null): jest.Mocked<IStockDocumentRepository> => ({
    findById: jest.fn().mockResolvedValue(entity),
    findByIdForUpdate: jest.fn().mockResolvedValue(entity),
    findByDocumentNumber: jest.fn(), list: jest.fn(),
    save: jest.fn(), update: jest.fn(), delete: jest.fn(),
  });
  const movementsRepository = (items: StockMovementEntity[] = []): jest.Mocked<IStockMovementRepository> => ({
    findById: jest.fn(),
    findByDocumentId: jest.fn().mockResolvedValue(items), saveMany: jest.fn(),
    list: jest.fn(), hasPostedOpening: jest.fn().mockResolvedValue(false),
    replaceForDocument: jest.fn(), deleteByDocumentId: jest.fn(),
  });
  const balancesRepository = (balance: StockBalanceEntity | null): jest.Mocked<IStockBalanceRepository> => ({
    findByWarehouseAndProduct: jest.fn(), lockWarehouseAndProduct: jest.fn(),
    listByWarehouse: jest.fn(), listByProduct: jest.fn(),
    listBelowMinimum: jest.fn(), listAboveMaximum: jest.fn(),
    listOutOfStockProducts: jest.fn(), listNegative: jest.fn(),
    companySummary: jest.fn(), valuation: jest.fn(),
    findByWarehouseAndProductForUpdate: jest.fn().mockResolvedValue(balance),
    saveOrUpdate: jest.fn(),
  });
  const publisher = { publish: jest.fn() } satisfies IEventPublisherPort;
  const unitOfWork = {
    run: jest.fn(async <T>(work: () => Promise<T>) => work()),
  } satisfies IUnitOfWorkPort;
  // Ürün bulunamadığı için eşik eventleri atlanır; balance.changed yine yayınlanır.
  const balanceEvents = new StockBalanceEventsPublisher(
    {
      findById: jest.fn().mockResolvedValue(null), findByIdForUpdate: jest.fn(),
      findBySku: jest.fn(), findByBarcode: jest.fn(), list: jest.fn(),
      lockCompanyProducts: jest.fn(), hasMovements: jest.fn(),
      save: jest.fn(), update: jest.fn(),
    },
    publisher,
  );
  const handler = (
    documents: IStockDocumentRepository,
    movements: IStockMovementRepository,
    balances: IStockBalanceRepository,
  ) =>
    new CancelStockDocumentHandler(
      documents, movements, balances, balanceEvents, publisher, unitOfWork, actor);

  const expectFailure = <T,>(
    result: Result<T, StockDocumentError>,
    code: StockDocumentError["code"],
  ) => {
    result.match(
      () => { throw new Error("expected failure"); },
      (error) => expect(error.code).toBe(code),
    );
  };

  beforeEach(() => jest.clearAllMocks());

  it("cancels a draft without touching balances", async () => {
    const entity = document("DRAFT");
    const documents = documentsRepository(entity);
    const balances = balancesRepository(null);
    const result = await handler(documents, movementsRepository(), balances)
      .execute(new CancelStockDocumentCommand(entity.id));
    expect(result.isSuccess).toBe(true);
    expect(entity.status).toBe("CANCELLED");
    expect(balances.saveOrUpdate).not.toHaveBeenCalled();
    expect(publisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "stock.document.cancelled" }),
    );
  });

  it("rejects cancelling a posted receipt whose stock was already consumed", async () => {
    const entity = document("POSTED");
    const incoming = movement(entity, "IN", "10.0000");
    const balance = new StockBalanceEntity({
      id: crypto.randomUUID(), companyId: entity.companyId,
      warehouseId: incoming.warehouseId, productId: incoming.productId,
      quantity: "4.0000", averageCost: "10.0000",
      lastMovementId: incoming.id, updatedAt: new Date(),
    });
    const documents = documentsRepository(entity);
    const balances = balancesRepository(balance);
    const result = await handler(documents, movementsRepository([incoming]), balances)
      .execute(new CancelStockDocumentCommand(entity.id));
    expectFailure(result, "INSUFFICIENT_STOCK");
    expect(entity.status).toBe("POSTED");
    expect(balances.saveOrUpdate).not.toHaveBeenCalled();
  });

  it("unwinds the average cost when cancelling a posted receipt", async () => {
    const entity = document("POSTED");
    // 10 birim @10 girişin iptali: değer 15*12 - 10*10 = 80, kalan 5 birim → maliyet 16.
    const incoming = movement(entity, "IN", "10.0000");
    const balance = new StockBalanceEntity({
      id: crypto.randomUUID(), companyId: entity.companyId,
      warehouseId: incoming.warehouseId, productId: incoming.productId,
      quantity: "15.0000", averageCost: "12.0000",
      lastMovementId: incoming.id, updatedAt: new Date(),
    });
    const documents = documentsRepository(entity);
    const balances = balancesRepository(balance);
    const result = await handler(documents, movementsRepository([incoming]), balances)
      .execute(new CancelStockDocumentCommand(entity.id));
    expect(result.isSuccess).toBe(true);
    expect(balances.saveOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: "5.0000", averageCost: "16.0000" }),
    );
  });

  it("reverses balances when cancelling a posted issue", async () => {
    const entity = document("POSTED", "SALE");
    const outgoing = movement(entity, "OUT", "3.0000");
    const balance = new StockBalanceEntity({
      id: crypto.randomUUID(), companyId: entity.companyId,
      warehouseId: outgoing.warehouseId, productId: outgoing.productId,
      quantity: "4.0000", averageCost: "10.0000",
      lastMovementId: outgoing.id, updatedAt: new Date(),
    });
    const documents = documentsRepository(entity);
    const balances = balancesRepository(balance);
    const result = await handler(documents, movementsRepository([outgoing]), balances)
      .execute(new CancelStockDocumentCommand(entity.id));
    expect(result.isSuccess).toBe(true);
    expect(entity.status).toBe("CANCELLED");
    expect(balances.saveOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: "7.0000", averageCost: "10.0000" }),
    );
  });
});
