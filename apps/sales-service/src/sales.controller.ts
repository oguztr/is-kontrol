import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import type { CreateQuoteDto, CreateOrderDto } from '@is-kontrol/sales-contracts';
import { CreateQuoteUseCase } from './use-cases/create-quote.use-case';
import { SendQuoteUseCase } from './use-cases/send-quote.use-case';
import { AcceptQuoteUseCase } from './use-cases/accept-quote.use-case';
import { RejectQuoteUseCase } from './use-cases/reject-quote.use-case';
import { ConvertQuoteToOrderUseCase } from './use-cases/convert-quote-to-order.use-case';
import { CreateOrderUseCase } from './use-cases/create-order.use-case';
import { ConfirmOrderUseCase } from './use-cases/confirm-order.use-case';
import { ShipOrderUseCase } from './use-cases/ship-order.use-case';
import { CancelOrderUseCase } from './use-cases/cancel-order.use-case';
import { CompleteOrderUseCase } from './use-cases/complete-order.use-case';
import { CheckCreditLimitUseCase } from './use-cases/check-credit-limit.use-case';

@Controller()
export class SalesController {
  constructor(
    private readonly createQuote: CreateQuoteUseCase,
    private readonly sendQuote: SendQuoteUseCase,
    private readonly acceptQuote: AcceptQuoteUseCase,
    private readonly rejectQuote: RejectQuoteUseCase,
    private readonly convertQuote: ConvertQuoteToOrderUseCase,
    private readonly createOrder: CreateOrderUseCase,
    private readonly confirmOrder: ConfirmOrderUseCase,
    private readonly shipOrder: ShipOrderUseCase,
    private readonly cancelOrder: CancelOrderUseCase,
    private readonly completeOrder: CompleteOrderUseCase,
    private readonly checkLimit: CheckCreditLimitUseCase
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'sales-service' };
  }

  @Post('quotes')
  postQuote(@Body() payload: CreateQuoteDto) {
    return this.createQuote.execute(payload);
  }

  @Post('quotes/:id/send')
  sendQuoteById(@Param('id') id: string, @Body() payload: { customerId: string }) {
    return this.sendQuote.execute({ quoteId: id, customerId: payload.customerId });
  }

  @Post('quotes/:id/accept')
  acceptQuoteById(@Param('id') id: string, @Body() payload: { customerId: string }) {
    return this.acceptQuote.execute({ quoteId: id, customerId: payload.customerId });
  }

  @Post('quotes/:id/reject')
  rejectQuoteById(@Param('id') id: string, @Body() payload: { reason?: string }) {
    return this.rejectQuote.execute({ quoteId: id, reason: payload.reason });
  }

  @Post('quotes/:id/convert')
  convertQuoteById(@Param('id') id: string, @Body() payload: { customerId: string }) {
    return this.convertQuote.execute({ quoteId: id, customerId: payload.customerId });
  }

  @Post('orders')
  postOrder(@Body() payload: CreateOrderDto) {
    return this.createOrder.execute(payload);
  }

  @Post('orders/:id/confirm')
  confirmOrderById(@Param('id') id: string) {
    return this.confirmOrder.execute({ orderId: id });
  }

  @Post('orders/:id/ship')
  shipOrderById(@Param('id') id: string) {
    return this.shipOrder.execute({ orderId: id });
  }

  @Post('orders/:id/cancel')
  cancelOrderById(@Param('id') id: string, @Body() payload: { reason?: string }) {
    return this.cancelOrder.execute({ orderId: id, reason: payload.reason });
  }

  @Post('orders/:id/complete')
  completeOrderById(@Param('id') id: string) {
    return this.completeOrder.execute({ orderId: id });
  }

  @Post('limits/check')
  postCheckLimit(@Body() payload: { customerId: string; amount: number }) {
    return this.checkLimit.execute(payload);
  }
}
