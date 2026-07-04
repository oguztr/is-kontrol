export class SalesOrderItemEntity {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly productId: string,
    public quantity: number,
    public unitPrice: number,
    public totalPrice: number
  ) {}
}
