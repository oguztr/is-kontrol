import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { ConvertOfferToOrderUseCase } from './use-cases/convert-offer-to-order.use-case';
import { CheckCreditLimitUseCase } from './use-cases/check-credit-limit.use-case';

@Module({
  controllers: [SalesController],
  providers: [ConvertOfferToOrderUseCase, CheckCreditLimitUseCase],
})
export class SalesModule {}
