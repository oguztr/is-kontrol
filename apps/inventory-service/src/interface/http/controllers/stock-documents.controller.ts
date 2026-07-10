import { Controller, Post, Patch, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import type { CreateStockDocumentHandler } from '../../../application/commands/stock-documents/create-stock-document/create-stock-document.handler'
import type { PostStockDocumentHandler } from '../../../application/commands/stock-documents/post-stock-document/post-stock-document.handler'
import { CreateStockDocumentCommand } from '../../../application/commands/stock-documents/create-stock-document/create-stock-document.command';
import { PostStockDocumentCommand } from '../../../application/commands/stock-documents/post-stock-document/post-stock-document.command';
import type { DocumentType } from '../../../domain/entities/stock-document.entity'

@Controller('stock-documents')
export class StockDocumentsController {
  constructor(
    private readonly createStockDocumentHandler: CreateStockDocumentHandler,
    private readonly postStockDocumentHandler: PostStockDocumentHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: {
    companyId: string;
    documentNumber: string;
    documentType: DocumentType;
    warehouseId: string;
    currencyId: string;
    documentDate: string;
    lines: Array<{
      productId: string;
      unitId: string;
      quantity: string;
      unitPrice: string;
      notes?: string;
    }>;
    targetWarehouseId?: string;
    partnerId?: string;
    exchangeRate?: string;
    notes?: string;
    createdBy?: string;
  }) {
    const command = new CreateStockDocumentCommand(
      body.companyId,
      body.documentNumber,
      body.documentType,
      body.warehouseId,
      body.currencyId,
      new Date(body.documentDate),
      body.lines.map((l) => ({
        productId: l.productId,
        unitId: l.unitId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        notes: l.notes ?? null,
      })),
      body.targetWarehouseId ?? null,
      body.partnerId ?? null,
      body.exchangeRate ?? '1',
      body.notes ?? null,
      body.createdBy ?? null,
    );
    return this.createStockDocumentHandler.execute(command);
  }

  @Patch(':id/post')
  @HttpCode(HttpStatus.NO_CONTENT)
  async post(@Param('id') id: string) {
    await this.postStockDocumentHandler.execute(new PostStockDocumentCommand(id));
  }
}
