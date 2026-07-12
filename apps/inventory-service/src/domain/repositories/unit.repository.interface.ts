import type { UnitGroupEntity } from "../entities/unit-group.entity";
import type { UnitOfMeasureEntity } from "../entities/unit-of-measure.entity";

export interface IUnitRepository {
  lockGroup(groupId: string): Promise<void>;
  lockGroupName(companyId: string, name: string): Promise<void>;
  findGroupById(id: string): Promise<UnitGroupEntity | null>;
  findGroupByName(companyId: string, name: string): Promise<UnitGroupEntity | null>;
  listGroups(companyId: string): Promise<UnitGroupEntity[]>;
  saveGroup(group: UnitGroupEntity): Promise<boolean>;
  updateGroup(group: UnitGroupEntity): Promise<boolean>;
  groupHasUnits(groupId: string): Promise<boolean>;
  findUnitById(id: string): Promise<UnitOfMeasureEntity | null>;
  findUnitByCode(companyId: string, code: string): Promise<UnitOfMeasureEntity | null>;
  listUnits(companyId: string, groupId?: string): Promise<UnitOfMeasureEntity[]>;
  saveUnit(unit: UnitOfMeasureEntity): Promise<boolean>;
  updateUnit(unit: UnitOfMeasureEntity): Promise<void>;
  groupHasBaseUnit(groupId: string): Promise<boolean>;
  clearBaseUnit(groupId: string, exceptUnitId: string): Promise<void>;
}
