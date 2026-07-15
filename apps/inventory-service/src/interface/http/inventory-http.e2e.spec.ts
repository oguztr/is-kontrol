import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Test } from "@nestjs/testing";
import { CreateProductHandler } from "../../application/commands/products/create-product/create-product.handler";
import { UpdateProductHandler } from "../../application/commands/products/update-product/update-product.handler";
import { ActivateProductHandler } from "../../application/commands/products/activate-product/activate-product.handler";
import { DeactivateProductHandler } from "../../application/commands/products/deactivate-product/deactivate-product.handler";
import { ArchiveProductHandler } from "../../application/commands/products/archive-product/archive-product.handler";
import { DeleteProductHandler } from "../../application/commands/products/delete-product/delete-product.handler";
import { ChangeProductBaseUnitHandler } from "../../application/commands/products/change-product-base-unit/change-product-base-unit.handler";
import { SetProductStockLevelsHandler } from "../../application/commands/products/set-product-stock-levels/set-product-stock-levels.handler";
import { GetProductHandler } from "../../application/queries/products/get-product/get-product.handler";
import { ListProductsHandler } from "../../application/queries/products/list-products/list-products.handler";
import { SearchProductsHandler } from "../../application/queries/products/search-products/search-products.handler";
import { GetProductBySkuHandler } from "../../application/queries/products/get-product-by-sku/get-product-by-sku.handler";
import { GetProductByBarcodeHandler } from "../../application/queries/products/get-product-by-barcode/get-product-by-barcode.handler";
import { CreateStockDocumentHandler } from "../../application/commands/stock-documents/create-stock-document/create-stock-document.handler";
import { PostStockDocumentHandler } from "../../application/commands/stock-documents/post-stock-document/post-stock-document.handler";
import { UpdateStockDocumentHandler } from "../../application/commands/stock-documents/update-stock-document/update-stock-document.handler";
import { DeleteStockDocumentHandler } from "../../application/commands/stock-documents/delete-stock-document/delete-stock-document.handler";
import { AddStockDocumentLineHandler } from "../../application/commands/stock-documents/add-stock-document-line/add-stock-document-line.handler";
import { UpdateStockDocumentLineHandler } from "../../application/commands/stock-documents/update-stock-document-line/update-stock-document-line.handler";
import { RemoveStockDocumentLineHandler } from "../../application/commands/stock-documents/remove-stock-document-line/remove-stock-document-line.handler";
import { CancelStockDocumentHandler } from "../../application/commands/stock-documents/cancel-stock-document/cancel-stock-document.handler";
import { GetStockDocumentHandler } from "../../application/queries/stock-documents/get-stock-document/get-stock-document.handler";
import { GetStockDocumentByNumberHandler } from "../../application/queries/stock-documents/get-stock-document-by-number/get-stock-document-by-number.handler";
import { ListStockDocumentsHandler } from "../../application/queries/stock-documents/list-stock-documents/list-stock-documents.handler";
import { ProductsController } from "./controllers/products.controller";
import { StockDocumentsController } from "./controllers/stock-documents.controller";
import { Failure, Success } from "@is-kontrol/shared-result";

describe("Inventory HTTP API", () => {
  let app: INestApplication;
  let baseUrl: string;

  const createProduct = jest.fn();
  const createStockDocument = jest.fn();
  const postStockDocument = jest.fn();

  // Controller'ların bağımlılığı yalnız execute() olan handler sınıflarıdır;
  // davranışı test edilmeyenlere boş stub verilir.
  const executeStub = () => ({ execute: jest.fn() });

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProductsController, StockDocumentsController],
      providers: [
        { provide: CreateProductHandler, useValue: { execute: createProduct } },
        { provide: UpdateProductHandler, useValue: executeStub() },
        { provide: ActivateProductHandler, useValue: executeStub() },
        { provide: DeactivateProductHandler, useValue: executeStub() },
        { provide: ArchiveProductHandler, useValue: executeStub() },
        { provide: DeleteProductHandler, useValue: executeStub() },
        { provide: ChangeProductBaseUnitHandler, useValue: executeStub() },
        { provide: SetProductStockLevelsHandler, useValue: executeStub() },
        { provide: GetProductHandler, useValue: executeStub() },
        { provide: ListProductsHandler, useValue: executeStub() },
        { provide: SearchProductsHandler, useValue: executeStub() },
        { provide: GetProductBySkuHandler, useValue: executeStub() },
        { provide: GetProductByBarcodeHandler, useValue: executeStub() },
        {
          provide: CreateStockDocumentHandler,
          useValue: { execute: createStockDocument },
        },
        {
          provide: PostStockDocumentHandler,
          useValue: { execute: postStockDocument },
        },
        { provide: UpdateStockDocumentHandler, useValue: executeStub() },
        { provide: DeleteStockDocumentHandler, useValue: executeStub() },
        { provide: AddStockDocumentLineHandler, useValue: executeStub() },
        { provide: UpdateStockDocumentLineHandler, useValue: executeStub() },
        { provide: RemoveStockDocumentLineHandler, useValue: executeStub() },
        { provide: CancelStockDocumentHandler, useValue: executeStub() },
        { provide: GetStockDocumentHandler, useValue: executeStub() },
        { provide: GetStockDocumentByNumberHandler, useValue: executeStub() },
        { provide: ListStockDocumentsHandler, useValue: executeStub() },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix("inventory");
    await app.listen(0, "127.0.0.1");
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("generates the OpenAPI document with zod-derived schemas", () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle("Inventory").setVersion("1").build(),
    );
    const createProduct = document.paths["/inventory/products"]?.post;
    expect(createProduct?.requestBody).toBeDefined();
    const body = createProduct?.requestBody as {
      content: Record<string, { schema: { required?: string[] } }>;
    };
    expect(body.content["application/json"].schema.required).toContain("sku");
    const listDocuments = document.paths["/inventory/stock-documents"]?.get;
    const parameterNames = (listDocuments?.parameters ?? []).map(
      (parameter) => (parameter as { name?: string }).name,
    );
    expect(parameterNames).toContain("companyId");
    expect(parameterNames).toContain("documentType");
  });

  it("rejects an invalid product body before invoking the handler", async () => {
    const response = await fetch(`${baseUrl}/inventory/products`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sku: "" }),
    });

    expect(response.status).toBe(400);
    expect(createProduct).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      message: "Validation failed",
      issues: expect.any(Array),
    });
  });

  it("applies DTO defaults and returns 201 for a valid product", async () => {
    const id = crypto.randomUUID();
    createProduct.mockResolvedValue(new Success({ id }));

    const response = await fetch(`${baseUrl}/inventory/products`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        companyId: crypto.randomUUID(),
        sku: "SKU-1",
        name: "Product",
        baseUnitId: crypto.randomUUID(),
      }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id });
    expect(createProduct.mock.calls[0][0].minStockLevel).toBe("0");
  });

  it("maps duplicate resources to 409", async () => {
    const companyId = crypto.randomUUID();
    createProduct.mockResolvedValue(
      new Failure({
        code: "PRODUCT_SKU_ALREADY_EXISTS",
        companyId,
        sku: "SKU-1",
      }),
    );

    const response = await fetch(`${baseUrl}/inventory/products`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        companyId,
        sku: "SKU-1",
        name: "Product",
        baseUnitId: crypto.randomUUID(),
      }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: "PRODUCT_SKU_ALREADY_EXISTS",
    });
  });

  it("maps missing body references to 422", async () => {
    const companyId = crypto.randomUUID();
    createProduct.mockResolvedValue(
      new Failure({ code: "COMPANY_NOT_FOUND", companyId }),
    );

    const response = await fetch(`${baseUrl}/inventory/products`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        companyId,
        sku: "SKU-1",
        name: "Product",
        baseUnitId: crypto.randomUUID(),
      }),
    });

    expect(response.status).toBe(422);
  });

  it("parses a valid stock document DTO and applies monetary defaults", async () => {
    const id = crypto.randomUUID();
    createStockDocument.mockResolvedValue(new Success({ id }));

    const response = await fetch(`${baseUrl}/inventory/stock-documents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        companyId: crypto.randomUUID(),
        documentNumber: "DOC-1",
        documentType: "PURCHASE",
        warehouseId: crypto.randomUUID(),
        currencyId: crypto.randomUUID(),
        documentDate: "2026-07-12T01:00:00.000Z",
        lines: [
          {
            productId: crypto.randomUUID(),
            unitId: crypto.randomUUID(),
            quantity: "2.5000",
          },
        ],
      }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id });
    const command = createStockDocument.mock.calls[0][0];
    expect(command.documentDate).toEqual(new Date("2026-07-12T01:00:00.000Z"));
    expect(command.exchangeRate).toBe("1");
    expect(command.lines[0].unitPrice).toBe("0");
  });

  it("validates document ids and maps a missing path resource to 404", async () => {
    const invalidResponse = await fetch(
      `${baseUrl}/inventory/stock-documents/not-a-uuid/post`,
      { method: "PATCH" },
    );

    expect(invalidResponse.status).toBe(400);
    expect(postStockDocument).not.toHaveBeenCalled();

    const documentId = crypto.randomUUID();
    postStockDocument.mockResolvedValue(
      new Failure({
        code: "DOCUMENT_NOT_FOUND",
        documentId,
      }),
    );
    const missingResponse = await fetch(
      `${baseUrl}/inventory/stock-documents/${documentId}/post`,
      { method: "PATCH" },
    );

    expect(missingResponse.status).toBe(404);
  });
});
