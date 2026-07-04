import { Controller, Get } from '@nestjs/common';
import { StockProxyService } from './stock-proxy.service';

@Controller('stock')
export class StockProxyController {
  constructor(private readonly stockProxy: StockProxyService) {}

  @Get('status')
  getStockStatus() {
    return this.stockProxy.getAggregatedStockStatus();
  }
}
