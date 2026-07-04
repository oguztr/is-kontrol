import { Injectable } from '@nestjs/common';

@Injectable()
export class CheckCreditLimitUseCase {
  execute(payload: { customerId: string; amount: number }) {
    return { approved: payload.amount <= 100000, ...payload };
  }
}
