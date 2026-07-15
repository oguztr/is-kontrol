import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import { StockBalanceEntity } from "../../../../domain/entities/stock-balance.entity";
import { StockDocumentEntity } from "../../../../domain/entities/stock-document.entity";
import type { DocumentType } from "../../../../domain/entities/stock-document.entity";
import { StockMovementEntity } from "../../../../domain/entities/stock-movement.entity";
import { ProductEntity } from "../../../../domain/entities/product.entity";
import { WarehouseEntity } from "../../../../domain/entities/warehouse.entity";
import type { IStockBalanceRepository } from "../../../../domain/repositories/stock-balance.repository.interface";
import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import { StockDocumentPostValidator } from "../stock-document-post.validator";
import { StockBalanceEventsPublisher } from "../stock-balance-events.publisher";
import { PostStockDocumentCommand } from "./post-stock-document.command";
import { PostStockDocumentHandler } from "./post-stock-document.handler";

const COMPANY_ID = "00000000-0000-4000-8000-000000000002";
const WAREHOUSE_ID = "00000000-0000-4000-8000-000000000003";
const TARGET_WAREHOUSE_ID = "00000000-0000-4000-8000-000000000007";
const CURRENCY_ID = "00000000-0000-4000-8000-000000000004";
const UNIT_ID = "00000000-0000-4000-8000-000000000005";
const PRODUCT_ID = "00000000-0000-4000-8000-000000000006";
const PARTNER_ID = "00000000-0000-4000-8000-000000000008";

describe("PostStockDocumentHandler", () => {
  const actor = { allowsCompany: () => true, userId: () => null };
  const document = (
    documentType: DocumentType = "PURCHASE",
    targetWarehouseId: string | null = null,
  ) =>
    new StockDocumentEntity({
      id: "00000000-0000-4000-8000-000000000001",
      companyId: COMPANY_ID,
      documentNumber: "DOC-1",
      documentType,
      status: "DRAFT",
      warehouseId: WAREHOUSE_ID,
      targetWarehouseId,
      partnerId: documentType === "PURCHASE" ? PARTNER_ID : null,
      currencyId: CURRENCY_ID,
      exchangeRate: "1",
      documentDate: new Date("2026-07-12T00:00:00Z"),
      notes: null,
      createdBy: null,
      createdAt: new Date("2026-07-12T00:00:00Z"),
    });

  const movement = (
    lineNumber: number,
    direction: "IN" | "OUT",
    warehouseId: string,
    unitPrice = "5.0000",
    quantity = "2.0000",
  ) =>
    new StockMovementEntity({
      id: crypto.randomUUID(),
      companyId: COMPANY_ID,
      documentId: "00000000-0000-4000-8000-000000000001",
      lineNumber,
      productId: PRODUCT_ID,
      warehouseId,
      direction,
      unitId: UNIT_ID,
      quantity,
      baseQuantity: quantity,
      unitPrice,
      currencyId: CURRENCY_ID,
      exchangeRate: "1.00000000",
      totalAmount: "10.0000",
      totalAmountBaseCurrency: "10.0000",
      notes: null,
      createdAt: new Date("2026-07-12T00:00:00Z"),
    });

  const permissiveProducts = () => ({
    findById: jest.fn(async (id: string) => new ProductEntity({
      id, companyId: COMPANY_ID, sku: "SKU-1", barcode: null,
      name: "Ürün", description: null, baseUnitId: UNIT_ID,
      categoryId: null, defaultCurrencyId: null,
      minStockLevel: "0", maxStockLevel: null,
      isActive: true, createdAt: new Date(),
    })),
    findByIdForUpdate: jest.fn(),
    findBySku: jest.fn(),
    findByBarcode: jest.fn(),
    list: jest.fn(),
    lockCompanyProducts: jest.fn(),
    hasMovements: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  });

  // Tüm referansları geçerli sayan doğrulayıcı; testler kilitleme ve bakiye
  // matematiğine odaklanır. Referans doğrulaması validator'ın kendi işidir.
  const permissiveValidator = () =>
    new StockDocumentPostValidator(
      {
        findById: jest.fn().mockResolvedValue({
          id: COMPANY_ID, name: "Co", isActive: true, syncedAt: new Date(),
        }),
        upsert: jest.fn(),
        setActive: jest.fn(),
      },
      {
        findById: jest.fn().mockResolvedValue({
          id: CURRENCY_ID, code: "TRY", isActive: true, syncedAt: new Date(),
        }),
        findByCode: jest.fn(),
        upsert: jest.fn(),
        setActive: jest.fn(),
      },
      {
        findById: jest.fn(async (id: string) => new WarehouseEntity({
          id, companyId: COMPANY_ID, code: "WH", name: "Depo",
          address: null, isActive: true, createdAt: new Date(),
        })),
        findByCode: jest.fn(),
        list: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        hasStock: jest.fn(),
      },
      {
        findById: jest.fn().mockResolvedValue({
          id: PARTNER_ID, companyId: COMPANY_ID, name: "Cari",
          type: "BOTH", isActive: true, syncedAt: new Date(),
        }),
        upsert: jest.fn(),
        setActive: jest.fn(),
      },
      permissiveProducts(),
      {
        findById: jest.fn(),
        findByProductAndUnit: jest.fn(),
        listByProduct: jest.fn(),
        lockProductUnits: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    );

  const balanceEventsFor = (eventPublisher: IEventPublisherPort) =>
    new StockBalanceEventsPublisher(permissiveProducts(), eventPublisher);

  const documentRepositoryFor = (entity: StockDocumentEntity) => ({
    findById: jest.fn(),
    findByIdForUpdate: jest.fn().mockResolvedValue(entity),
    findByDocumentNumber: jest.fn(),
    list: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } satisfies IStockDocumentRepository);

  const movementRepositoryFor = (
    movements: StockMovementEntity[],
    hasPostedOpening = false,
  ) => ({
    findById: jest.fn(),
    findByDocumentId: jest.fn().mockResolvedValue(movements),
    saveMany: jest.fn(),
    list: jest.fn(),
    hasPostedOpening: jest.fn().mockResolvedValue(hasPostedOpening),
    replaceForDocument: jest.fn(),
    deleteByDocumentId: jest.fn(),
  } satisfies IStockMovementRepository);

  const balanceRepositoryFor = (
    lookup: (warehouseId: string) => StockBalanceEntity | null,
    savedBalances: StockBalanceEntity[],
  ) => ({
    findByWarehouseAndProduct: jest.fn(),
    listByWarehouse: jest.fn(),
    listByProduct: jest.fn(),
    listBelowMinimum: jest.fn(),
    listAboveMaximum: jest.fn(),
    listOutOfStockProducts: jest.fn(),
    listNegative: jest.fn(),
    companySummary: jest.fn(),
    valuation: jest.fn(),
    lockWarehouseAndProduct: jest.fn().mockResolvedValue(undefined),
    findByWarehouseAndProductForUpdate: jest.fn(
      async (warehouseId: string) => lookup(warehouseId),
    ),
    saveOrUpdate: jest.fn(async (balance: StockBalanceEntity) => {
      savedBalances.push(balance);
    }),
  } satisfies IStockBalanceRepository);

  const eventPublisherStub = () =>
    ({ publish: jest.fn().mockResolvedValue(undefined) }) satisfies IEventPublisherPort;

  const unitOfWorkStub = () =>
    ({
      run: jest.fn(async <T>(work: () => Promise<T>) => work()),
    }) satisfies IUnitOfWorkPort;

  it("locks the document and missing balance key before applying movements", async () => {
    const currentDocument = document();
    const savedBalances: StockBalanceEntity[] = [];
    const documentRepository = documentRepositoryFor(currentDocument);
    const movementRepository = movementRepositoryFor([
      movement(1, "IN", WAREHOUSE_ID),
    ]);
    const balanceRepository = balanceRepositoryFor(() => null, savedBalances);
    const eventPublisher = eventPublisherStub();
    const handler = new PostStockDocumentHandler(
      documentRepository,
      movementRepository,
      balanceRepository,
      permissiveValidator(),
      balanceEventsFor(eventPublisher),
      eventPublisher,
      unitOfWorkStub(),
      actor,
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
      WAREHOUSE_ID,
      PRODUCT_ID,
    );
    expect(savedBalances[0].quantity).toBe("2.0000");
    expect(currentDocument.status).toBe("POSTED");
    // posted + purchase.received + stock.increased + balance.changed + cost.changed (0 → 5)
    expect(eventPublisher.publish).toHaveBeenCalledTimes(5);
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "stock.document.posted" }),
    );
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "stock.purchase.received" }),
    );
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "stock.increased",
        payload: expect.objectContaining({ quantity: "2.0000" }),
      }),
    );
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "stock.balance.changed",
        payload: expect.objectContaining({
          quantity: "2.0000",
          previousQuantity: "0.0000",
        }),
      }),
    );
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "inventory.cost.changed" }),
    );
  });

  it("does not apply an already posted document", async () => {
    const currentDocument = document();
    currentDocument.post();
    const documentRepository = documentRepositoryFor(currentDocument);
    const movementRepository = movementRepositoryFor([]);
    const eventPublisher = eventPublisherStub();
    const handler = new PostStockDocumentHandler(
      documentRepository,
      movementRepository,
      balanceRepositoryFor(() => null, []),
      permissiveValidator(),
      balanceEventsFor(eventPublisher),
      eventPublisher,
      unitOfWorkStub(),
      actor,
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

  it("requires a partner when posting a purchase document", async () => {
    const currentDocument = document();
    currentDocument.updateDraft({ partnerId: null });
    const balanceRepository = balanceRepositoryFor(() => null, []);
    const handler = new PostStockDocumentHandler(
      documentRepositoryFor(currentDocument),
      movementRepositoryFor([movement(1, "IN", WAREHOUSE_ID)]),
      balanceRepository,
      permissiveValidator(),
      balanceEventsFor(eventPublisherStub()),
      eventPublisherStub(),
      unitOfWorkStub(),
      actor,
    );

    const result = await handler.execute(
      new PostStockDocumentCommand(currentDocument.id),
    );
    expect(result.isFailure).toBe(true);
    expect(
      result.match(
        () => null,
        (error) => error.code,
      ),
    ).toBe("PARTNER_REQUIRED");
    expect(balanceRepository.saveOrUpdate).not.toHaveBeenCalled();
    expect(currentDocument.status).toBe("DRAFT");
  });

  it("values a transfer's target entry at the source average cost", async () => {
    const transferDocument = document("TRANSFER", TARGET_WAREHOUSE_ID);
    const sourceBalance = new StockBalanceEntity({
      id: crypto.randomUUID(),
      companyId: COMPANY_ID,
      warehouseId: WAREHOUSE_ID,
      productId: PRODUCT_ID,
      quantity: "10.0000",
      averageCost: "4.0000",
      lastMovementId: null,
      updatedAt: new Date(),
    });
    const savedBalances: StockBalanceEntity[] = [];
    const eventPublisher = eventPublisherStub();
    const handler = new PostStockDocumentHandler(
      documentRepositoryFor(transferDocument),
      movementRepositoryFor([
        // Kullanıcının satıra yazdığı 99 fiyatı transferde maliyet olmamalı.
        movement(1, "OUT", WAREHOUSE_ID, "99.0000", "5.0000"),
        movement(2, "IN", TARGET_WAREHOUSE_ID, "99.0000", "5.0000"),
      ]),
      balanceRepositoryFor(
        (warehouseId) => (warehouseId === WAREHOUSE_ID ? sourceBalance : null),
        savedBalances,
      ),
      permissiveValidator(),
      balanceEventsFor(eventPublisher),
      eventPublisher,
      unitOfWorkStub(),
      actor,
    );

    const result = await handler.execute(
      new PostStockDocumentCommand(transferDocument.id),
    );
    expect(result.isSuccess).toBe(true);
    const source = savedBalances.find(
      (balance) => balance.warehouseId === WAREHOUSE_ID,
    );
    const target = savedBalances.find(
      (balance) => balance.warehouseId === TARGET_WAREHOUSE_ID,
    );
    expect(source?.quantity).toBe("5.0000");
    expect(source?.averageCost).toBe("4.0000");
    expect(target?.quantity).toBe("5.0000");
    expect(target?.averageCost).toBe("4.0000");
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "stock.transfer.completed" }),
    );
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "stock.transferred",
        payload: expect.objectContaining({
          fromWarehouseId: WAREHOUSE_ID,
          toWarehouseId: TARGET_WAREHOUSE_ID,
          quantity: "5.0000",
        }),
      }),
    );
  });

  it("rejects a second posted opening for the same warehouse and product", async () => {
    const openingDocument = document("OPENING");
    const balanceRepository = balanceRepositoryFor(() => null, []);
    const eventPublisher = eventPublisherStub();
    const handler = new PostStockDocumentHandler(
      documentRepositoryFor(openingDocument),
      movementRepositoryFor([movement(1, "IN", WAREHOUSE_ID)], true),
      balanceRepository,
      permissiveValidator(),
      balanceEventsFor(eventPublisher),
      eventPublisher,
      unitOfWorkStub(),
      actor,
    );

    const result = await handler.execute(
      new PostStockDocumentCommand(openingDocument.id),
    );
    expect(result.isFailure).toBe(true);
    expect(
      result.match(
        () => null,
        (error) => error.code,
      ),
    ).toBe("OPENING_ALREADY_EXISTS");
    expect(balanceRepository.saveOrUpdate).not.toHaveBeenCalled();
    expect(openingDocument.status).toBe("DRAFT");
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });
});
