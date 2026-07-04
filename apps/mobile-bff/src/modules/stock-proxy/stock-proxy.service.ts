import { Injectable } from '@nestjs/common';

@Injectable()
export class StockProxyService {
  getAggregatedStockStatus() {
    return {
      summary: 'Stok durumu özeti',
      items: [],
    };
  }
}
