import { Module } from '@nestjs/common';
import { StockProxyModule } from './modules/stock-proxy/stock-proxy.module';
import { SalesProxyModule } from './modules/sales-proxy/sales-proxy.module';

@Module({
  imports: [StockProxyModule, SalesProxyModule],
})
export class MobileBffModule {}
