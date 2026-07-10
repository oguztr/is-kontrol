export type MovementDirection = 'IN' | 'OUT';

export class StockMovementEntity {
  public readonly id: string;
  public readonly companyId: string;
  public readonly documentId: string;
  public readonly lineNumber: number;
  public readonly productId: string;
  public readonly warehouseId: string;
  public readonly direction: MovementDirection;
  public readonly unitId: string;
  public readonly quantity: string;
  public readonly baseQuantity: string;
  public readonly unitPrice: string;
  public readonly currencyId: string;
  public readonly exchangeRate: string;
  public readonly totalAmount: string;
  public readonly totalAmountBaseCurrency: string;
  public notes: string | null;
  public readonly createdAt: Date;

  constructor(params: {
    id: string;
    companyId: string;
    documentId: string;
    lineNumber: number;
    productId: string;
    warehouseId: string;
    direction: MovementDirection;
    unitId: string;
    quantity: string;
    baseQuantity: string;
    unitPrice: string;
    currencyId: string;
    exchangeRate: string;
    totalAmount: string;
    totalAmountBaseCurrency: string;
    notes: string | null;
    createdAt: Date;
  }) {
    this.id = params.id;
    this.companyId = params.companyId;
    this.documentId = params.documentId;
    this.lineNumber = params.lineNumber;
    this.productId = params.productId;
    this.warehouseId = params.warehouseId;
    this.direction = params.direction;
    this.unitId = params.unitId;
    this.quantity = params.quantity;
    this.baseQuantity = params.baseQuantity;
    this.unitPrice = params.unitPrice;
    this.currencyId = params.currencyId;
    this.exchangeRate = params.exchangeRate;
    this.totalAmount = params.totalAmount;
    this.totalAmountBaseCurrency = params.totalAmountBaseCurrency;
    this.notes = params.notes;
    this.createdAt = params.createdAt;
  }
}
