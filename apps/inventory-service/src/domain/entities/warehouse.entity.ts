export class WarehouseEntity {
  public readonly id: string;
  public readonly companyId: string;
  public readonly code: string;
  public name: string;
  public address: string | null;
  public isActive: boolean;
  public readonly createdAt: Date;

  constructor(params: {
    id: string;
    companyId: string;
    code: string;
    name: string;
    address: string | null;
    isActive: boolean;
    createdAt: Date;
  }) {
    this.id = params.id;
    this.companyId = params.companyId;
    this.code = params.code;
    this.name = params.name;
    this.address = params.address;
    this.isActive = params.isActive;
    this.createdAt = params.createdAt;
  }
}
