export interface CreateQuoteItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface CreateQuoteDto {
  customerId: string;
  items: CreateQuoteItemDto[];
  validUntil: string;
}

export interface QuoteItemDto {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

export interface QuoteResponseDto {
  id: string;
  quoteNumber: string;
  status: string;
  items: QuoteItemDto[];
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    grandTotal: number;
  };
}

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderDto {
  customerId: string;
  quoteId?: string;
  items: CreateOrderItemDto[];
}
