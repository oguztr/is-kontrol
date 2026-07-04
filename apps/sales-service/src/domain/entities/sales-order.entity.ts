export type SalesOrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'CANCELLED'
  | 'COMPLETED';

export class SalesOrderEntity {
  constructor(
    public readonly id: string,
    public readonly orderNumber: string,
    public readonly customerId: string,
    public readonly quoteId: string | null,
    public status: SalesOrderStatus,
    public totalAmount: number,
    public readonly createdAt: Date
  ) {}
}
