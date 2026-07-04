import { Module } from '@nestjs/common';
import { SalesProxyController } from './sales-proxy.controller';
import { SalesProxyService } from './sales-proxy.service';

@Module({
  controllers: [SalesProxyController],
  providers: [SalesProxyService],
})
export class SalesProxyModule {}
