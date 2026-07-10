import type { WarehouseEntity } from '../entities/warehouse.entity'

export interface IWarehouseRepository {
  findById(id: string): Promise<WarehouseEntity | null>;
  findByCode(companyId: string, code: string): Promise<WarehouseEntity | null>;
  save(warehouse: WarehouseEntity): Promise<void>;
}
