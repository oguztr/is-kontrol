import { Controller, Post, Patch, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CreateStockDocumentHandler } from '../../../application/commands/stock-documents/create-stock-document/create-stock-document.handler';
import { PostStockDocumentHandler } from '../../../application/commands/stock-documents/post-stock-document/post-stock-document.handler';
import { CreateStockDocumentCommand } from '../../../application/commands/stock-documents/create-stock-document/create-stock-document.command';
import { PostStockDocumentCommand } from '../../../application/commands/stock-documents/post-stock-document/post-stock-document.command';
import { createStockDocumentSchema } from '../dto/stock-documents/create-stock-document.dto';
import type { CreateStockDocumentDto } from '../dto/stock-documents/create-stock-document.dto';
import { idParamSchema } from '../dto/common/id-param.dto';
import type { IdParamDto } from '../dto/common/id-param.dto';
import { ZodValidationPipe } from '../zod-validation.pipe';
import { unwrapDomainResult } from '../domain-error.mapper';

@Controller('stock-documents')
export class StockDocumentsController {
  constructor(
    private readonly createStockDocumentHandler: CreateStockDocumentHandler,
    private readonly postStockDocumentHandler: PostStockDocumentHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createStockDocumentSchema))
    body: CreateStockDocumentDto,
  ) {
    const command = new CreateStockDocumentCommand(
      body.companyId,
      body.documentNumber,
      body.documentType,
      body.warehouseId,
      body.currencyId,
      body.documentDate,
      body.lines.map((line) => ({
        productId: line.productId,
        unitId: line.unitId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        notes: line.notes ?? null,
      })),
      body.targetWarehouseId ?? null,
      body.partnerId ?? null,
      body.exchangeRate,
      body.notes ?? null,
      body.createdBy ?? null,
    );
    return unwrapDomainResult(
      await this.createStockDocumentHandler.execute(command),
    );
  }

  @Patch(':id/post')
  @HttpCode(HttpStatus.NO_CONTENT)
  async post(
    @Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
  ) {
    unwrapDomainResult(
      await this.postStockDocumentHandler.execute(new PostStockDocumentCommand(id)),
    );
  }
}
