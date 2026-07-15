import { Controller, Post, Patch, Get, Delete, Body, Param, Query, HttpCode, HttpStatus, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodBody, ZodQueries } from '../openapi/zod-openapi';
import { ZodValidationPipe, idParamSchema } from '@is-kontrol/shared-validation';
import type { IdParamDto } from '@is-kontrol/shared-validation';
import { CreateStockDocumentHandler } from '../../../application/commands/stock-documents/create-stock-document/create-stock-document.handler';
import { PostStockDocumentHandler } from '../../../application/commands/stock-documents/post-stock-document/post-stock-document.handler';
import { CreateStockDocumentCommand } from '../../../application/commands/stock-documents/create-stock-document/create-stock-document.command';
import { PostStockDocumentCommand } from '../../../application/commands/stock-documents/post-stock-document/post-stock-document.command';
import { UpdateStockDocumentCommand } from '../../../application/commands/stock-documents/update-stock-document/update-stock-document.command';
import { UpdateStockDocumentHandler } from '../../../application/commands/stock-documents/update-stock-document/update-stock-document.handler';
import { DeleteStockDocumentCommand } from '../../../application/commands/stock-documents/delete-stock-document/delete-stock-document.command';
import { DeleteStockDocumentHandler } from '../../../application/commands/stock-documents/delete-stock-document/delete-stock-document.handler';
import { AddStockDocumentLineCommand } from '../../../application/commands/stock-documents/add-stock-document-line/add-stock-document-line.command';
import { AddStockDocumentLineHandler } from '../../../application/commands/stock-documents/add-stock-document-line/add-stock-document-line.handler';
import { UpdateStockDocumentLineCommand } from '../../../application/commands/stock-documents/update-stock-document-line/update-stock-document-line.command';
import { UpdateStockDocumentLineHandler } from '../../../application/commands/stock-documents/update-stock-document-line/update-stock-document-line.handler';
import { RemoveStockDocumentLineCommand } from '../../../application/commands/stock-documents/remove-stock-document-line/remove-stock-document-line.command';
import { RemoveStockDocumentLineHandler } from '../../../application/commands/stock-documents/remove-stock-document-line/remove-stock-document-line.handler';
import { CancelStockDocumentCommand } from '../../../application/commands/stock-documents/cancel-stock-document/cancel-stock-document.command';
import { CancelStockDocumentHandler } from '../../../application/commands/stock-documents/cancel-stock-document/cancel-stock-document.handler';
import { GetStockDocumentQuery } from '../../../application/queries/stock-documents/get-stock-document/get-stock-document.query';
import { GetStockDocumentHandler } from '../../../application/queries/stock-documents/get-stock-document/get-stock-document.handler';
import { GetStockDocumentByNumberQuery } from '../../../application/queries/stock-documents/get-stock-document-by-number/get-stock-document-by-number.query';
import { GetStockDocumentByNumberHandler } from '../../../application/queries/stock-documents/get-stock-document-by-number/get-stock-document-by-number.handler';
import { ListStockDocumentsQuery } from '../../../application/queries/stock-documents/list-stock-documents/list-stock-documents.query';
import { ListStockDocumentsHandler } from '../../../application/queries/stock-documents/list-stock-documents/list-stock-documents.handler';
import { createStockDocumentSchema } from '../dto/stock-documents/create-stock-document.dto';
import type { CreateStockDocumentDto } from '../dto/stock-documents/create-stock-document.dto';
import {
  addDocumentLineSchema, documentNumberQuerySchema, lineNumberParamSchema,
  stockDocumentListQuerySchema, updateDocumentLineSchema, updateStockDocumentSchema,
} from '../dto/stock-documents/update-stock-document.dto';
import type {
  AddDocumentLineDto, DocumentNumberQueryDto, LineNumberParamDto,
  StockDocumentListQueryDto, UpdateDocumentLineDto, UpdateStockDocumentDto,
} from '../dto/stock-documents/update-stock-document.dto';
import { InventoryDomainResultInterceptor } from '../domain-result.interceptor';

@ApiTags('stock-documents')
@Controller('stock-documents')
@UseInterceptors(InventoryDomainResultInterceptor)
export class StockDocumentsController {
  constructor(
    private readonly createStockDocument: CreateStockDocumentHandler,
    private readonly postStockDocument: PostStockDocumentHandler,
    private readonly updateStockDocument: UpdateStockDocumentHandler,
    private readonly deleteStockDocument: DeleteStockDocumentHandler,
    private readonly addStockDocumentLine: AddStockDocumentLineHandler,
    private readonly updateStockDocumentLine: UpdateStockDocumentLineHandler,
    private readonly removeStockDocumentLine: RemoveStockDocumentLineHandler,
    private readonly cancelStockDocument: CancelStockDocumentHandler,
    private readonly getStockDocument: GetStockDocumentHandler,
    private readonly getStockDocumentByNumber: GetStockDocumentByNumberHandler,
    private readonly listStockDocuments: ListStockDocumentsHandler,
  ) {}

  @ZodBody(createStockDocumentSchema)
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
    return this.createStockDocument.execute(command);
  }

  @ZodQueries(stockDocumentListQuerySchema)
  @Get()
  async list(@Query(new ZodValidationPipe(stockDocumentListQuerySchema)) query: StockDocumentListQueryDto) {
    return this.listStockDocuments.execute(new ListStockDocumentsQuery(
      query.companyId, query.documentNumber, query.documentType, query.status,
      query.dateFrom, query.dateTo, query.partnerId, query.warehouseId));
  }

  @ZodQueries(documentNumberQuerySchema)
  @Get('number/:documentNumber')
  async byNumber(@Param('documentNumber') documentNumber: string,
    @Query(new ZodValidationPipe(documentNumberQuerySchema)) query: DocumentNumberQueryDto) {
    return this.getStockDocumentByNumber.execute(
      new GetStockDocumentByNumberQuery(query.companyId, documentNumber));
  }

  @Get(':id')
  async get(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.getStockDocument.execute(new GetStockDocumentQuery(id));
  }

  @ZodBody(updateStockDocumentSchema)
  @Patch(':id')
  async update(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(updateStockDocumentSchema)) body: UpdateStockDocumentDto) {
    return this.updateStockDocument.execute(new UpdateStockDocumentCommand(
      id, body.documentDate, body.partnerId, body.exchangeRate, body.notes));
  }

  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.deleteStockDocument.execute(new DeleteStockDocumentCommand(id));
  }

  @ZodBody(addDocumentLineSchema)
  @Post(':id/lines') @HttpCode(HttpStatus.CREATED)
  async addLine(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(addDocumentLineSchema)) body: AddDocumentLineDto) {
    return this.addStockDocumentLine.execute(new AddStockDocumentLineCommand(
      id, body.productId, body.unitId, body.quantity, body.unitPrice, body.notes ?? null));
  }

  @ZodBody(updateDocumentLineSchema)
  @Patch(':id/lines/:lineNumber')
  async updateLine(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Param('lineNumber', new ZodValidationPipe(lineNumberParamSchema)) lineNumber: LineNumberParamDto,
    @Body(new ZodValidationPipe(updateDocumentLineSchema)) body: UpdateDocumentLineDto) {
    return this.updateStockDocumentLine.execute(new UpdateStockDocumentLineCommand(
      id, lineNumber, body.productId, body.unitId, body.quantity, body.unitPrice, body.notes));
  }

  @Delete(':id/lines/:lineNumber') @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLine(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Param('lineNumber', new ZodValidationPipe(lineNumberParamSchema)) lineNumber: LineNumberParamDto) {
    return this.removeStockDocumentLine.execute(
      new RemoveStockDocumentLineCommand(id, lineNumber));
  }

  @Patch(':id/post')
  @HttpCode(HttpStatus.NO_CONTENT)
  async post(
    @Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
  ) {
    return this.postStockDocument.execute(new PostStockDocumentCommand(id));
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(
    @Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
  ) {
    return this.cancelStockDocument.execute(new CancelStockDocumentCommand(id));
  }
}
