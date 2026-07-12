import { Controller, Get, Param, NotImplementedException } from '@nestjs/common';

@Controller('stock-movements')
export class StockMovementsController {
  @Get('document/:documentId')
  listByDocument(@Param('documentId') _documentId: string) {
    throw new NotImplementedException(
      `Movement query is not implemented for document ${_documentId}`,
    );
  }
}
