import { Controller, Get, Param, NotImplementedException } from '@nestjs/common';

@Controller('stock-balances')
export class StockBalancesController {
  @Get(':warehouseId/:productId')
  getBalance(
    @Param('warehouseId') _warehouseId: string,
    @Param('productId') _productId: string,
  ) {
    throw new NotImplementedException(
      `Balance query is not implemented for ${_warehouseId}/${_productId}`,
    );
  }
}
