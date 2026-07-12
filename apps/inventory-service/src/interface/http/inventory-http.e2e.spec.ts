import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CreateProductHandler } from '../../application/commands/products/create-product/create-product.handler';
import { CreateStockDocumentHandler } from '../../application/commands/stock-documents/create-stock-document/create-stock-document.handler';
import { PostStockDocumentHandler } from '../../application/commands/stock-documents/post-stock-document/post-stock-document.handler';
import { ProductsController } from './controllers/products.controller';
import { StockDocumentsController } from './controllers/stock-documents.controller';
import { Failure, Success } from '../../application/result';
import { ProductManagementUseCase } from '../../application/use-cases/product-management.use-case';

describe('Inventory HTTP API', () => {
  let app: INestApplication;
  let baseUrl: string;

  const createProduct = jest.fn();
  const createStockDocument = jest.fn();
  const postStockDocument = jest.fn();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProductsController, StockDocumentsController],
      providers: [
        { provide: CreateProductHandler, useValue: { execute: createProduct } },
        {
          provide: ProductManagementUseCase,
          useValue: {
            update: jest.fn(), activate: jest.fn(), deactivate: jest.fn(),
            archive: jest.fn(), delete: jest.fn(), changeBaseUnit: jest.fn(),
            setStockLevels: jest.fn(), list: jest.fn(), get: jest.fn(),
            bySku: jest.fn(), byBarcode: jest.fn(),
          },
        },
        {
          provide: CreateStockDocumentHandler,
          useValue: { execute: createStockDocument },
        },
        {
          provide: PostStockDocumentHandler,
          useValue: { execute: postStockDocument },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('inventory');
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects an invalid product body before invoking the handler', async () => {
    const response = await fetch(`${baseUrl}/inventory/products`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sku: '' }),
    });

    expect(response.status).toBe(400);
    expect(createProduct).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      message: 'Validation failed',
      issues: expect.any(Array),
    });
  });

  it('applies DTO defaults and returns 201 for a valid product', async () => {
    const id = crypto.randomUUID();
    createProduct.mockResolvedValue(new Success({ id }));

    const response = await fetch(`${baseUrl}/inventory/products`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        companyId: crypto.randomUUID(),
        sku: 'SKU-1',
        name: 'Product',
        baseUnitId: crypto.randomUUID(),
      }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id });
    expect(createProduct.mock.calls[0][0].minStockLevel).toBe('0');
  });

  it('maps duplicate resources to 409', async () => {
    const companyId = crypto.randomUUID();
    createProduct.mockResolvedValue(new Failure({
      code: 'PRODUCT_SKU_ALREADY_EXISTS',
      companyId,
      sku: 'SKU-1',
    }));

    const response = await fetch(`${baseUrl}/inventory/products`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        companyId,
        sku: 'SKU-1',
        name: 'Product',
        baseUnitId: crypto.randomUUID(),
      }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'PRODUCT_SKU_ALREADY_EXISTS',
    });
  });

  it('maps missing body references to 422', async () => {
    const companyId = crypto.randomUUID();
    createProduct.mockResolvedValue(
      new Failure({ code: 'COMPANY_NOT_FOUND', companyId }),
    );

    const response = await fetch(`${baseUrl}/inventory/products`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        companyId,
        sku: 'SKU-1',
        name: 'Product',
        baseUnitId: crypto.randomUUID(),
      }),
    });

    expect(response.status).toBe(422);
  });

  it('parses a valid stock document DTO and applies monetary defaults', async () => {
    const id = crypto.randomUUID();
    createStockDocument.mockResolvedValue(new Success({ id }));

    const response = await fetch(`${baseUrl}/inventory/stock-documents`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        companyId: crypto.randomUUID(),
        documentNumber: 'DOC-1',
        documentType: 'PURCHASE',
        warehouseId: crypto.randomUUID(),
        currencyId: crypto.randomUUID(),
        documentDate: '2026-07-12T01:00:00.000Z',
        lines: [
          {
            productId: crypto.randomUUID(),
            unitId: crypto.randomUUID(),
            quantity: '2.5000',
          },
        ],
      }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id });
    const command = createStockDocument.mock.calls[0][0];
    expect(command.documentDate).toEqual(new Date('2026-07-12T01:00:00.000Z'));
    expect(command.exchangeRate).toBe('1');
    expect(command.lines[0].unitPrice).toBe('0');
  });

  it('validates document ids and maps a missing path resource to 404', async () => {
    const invalidResponse = await fetch(
      `${baseUrl}/inventory/stock-documents/not-a-uuid/post`,
      { method: 'PATCH' },
    );

    expect(invalidResponse.status).toBe(400);
    expect(postStockDocument).not.toHaveBeenCalled();

    const documentId = crypto.randomUUID();
    postStockDocument.mockResolvedValue(new Failure({
      code: 'DOCUMENT_NOT_FOUND',
      documentId,
    }));
    const missingResponse = await fetch(
      `${baseUrl}/inventory/stock-documents/${documentId}/post`,
      { method: 'PATCH' },
    );

    expect(missingResponse.status).toBe(404);
  });
});
