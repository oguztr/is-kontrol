import { Injectable } from '@nestjs/common';

@Injectable()
export class ConvertOfferToOrderUseCase {
  execute(payload: { offerId: string; tenantId: string }) {
    return { orderId: crypto.randomUUID(), ...payload };
  }
}
