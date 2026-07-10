import { Controller, Get, Param } from '@nestjs/common';

@Controller('stock-movements')
export class StockMovementsController {
  @Get('document/:documentId')
  listByDocument(@Param('documentId') _documentId: string) {
    // TODO: wire list-movements query handler
    return [];
  }
}
