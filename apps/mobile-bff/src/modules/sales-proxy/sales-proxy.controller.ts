import { Controller, Get } from '@nestjs/common';
import { SalesProxyService } from './sales-proxy.service';

@Controller('sales')
export class SalesProxyController {
  constructor(private readonly salesProxy: SalesProxyService) {}

  @Get('dashboard')
  getSalesDashboard() {
    return this.salesProxy.getSalesDashboard();
  }
}
