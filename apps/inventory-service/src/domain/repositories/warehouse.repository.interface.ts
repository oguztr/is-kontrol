import type { WarehouseEntity } from '../entities/warehouse.entity'

export interface IWarehouseRepository {
  findById(id: string): Promise<WarehouseEntity | null>;
  findByCode(companyId: string, code: string): Promise<WarehouseEntity | null>;
  list(companyId: string): Promise<WarehouseEntity[]>;
  save(warehouse: WarehouseEntity): Promise<boolean>;
  update(warehouse: WarehouseEntity): Promise<void>;
  hasStock(warehouseId: string): Promise<boolean>;
}
