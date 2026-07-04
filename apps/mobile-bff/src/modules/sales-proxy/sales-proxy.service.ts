import { Injectable } from '@nestjs/common';

@Injectable()
export class SalesProxyService {
  getSalesDashboard() {
    return {
      totalOffers: 0,
      pendingOrders: 0,
      revenue: 0,
    };
  }
}
