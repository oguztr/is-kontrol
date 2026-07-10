import { Controller, Get, Param } from '@nestjs/common';

@Controller('stock-balances')
export class StockBalancesController {
  @Get(':warehouseId/:productId')
  getBalance(
    @Param('warehouseId') _warehouseId: string,
    @Param('productId') _productId: string,
  ) {
    // TODO: wire get-balance query handler
    return null;
  }
}
