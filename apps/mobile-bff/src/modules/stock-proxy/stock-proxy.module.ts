import { Module } from '@nestjs/common';
import { StockProxyController } from './stock-proxy.controller';
import { StockProxyService } from './stock-proxy.service';

@Module({
  controllers: [StockProxyController],
  providers: [StockProxyService],
})
export class StockProxyModule {}
