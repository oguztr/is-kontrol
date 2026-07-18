import type { RoleEntity } from "../entities/role.entity";

export interface IRoleRepository {
  findById(id: string): Promise<RoleEntity | null>;
  /** companyId null → sistem rolü arar. */
  findByCode(code: string, companyId: string | null): Promise<RoleEntity | null>;
  /** Firmanın görebildiği roller: sistem rolleri + firmaya özel roller. */
  listForCompany(companyId: string): Promise<RoleEntity[]>;
  save(role: RoleEntity): Promise<void>;
  update(role: RoleEntity): Promise<void>;
}
