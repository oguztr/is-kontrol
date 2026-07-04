import { Controller, Get, Post, Body } from '@nestjs/common';
import { ConvertOfferToOrderUseCase } from './use-cases/convert-offer-to-order.use-case';
import { CheckCreditLimitUseCase } from './use-cases/check-credit-limit.use-case';

@Controller()
export class SalesController {
  constructor(
    private readonly convertOffer: ConvertOfferToOrderUseCase,
    private readonly checkLimit: CheckCreditLimitUseCase
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'sales-service' };
  }

  @Post('offers/convert')
  convertToOrder(@Body() payload: { offerId: string; tenantId: string }) {
    return this.convertOffer.execute(payload);
  }

  @Post('limits/check')
  checkLimit(@Body() payload: { customerId: string; amount: number }) {
    return this.checkLimit.execute(payload);
  }
}
