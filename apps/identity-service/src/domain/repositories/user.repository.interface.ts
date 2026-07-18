import type { UserEntity } from "../entities/user.entity";

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByIdForUpdate(id: string): Promise<UserEntity | null>;
  /** E-posta global unique olduğundan firma bağımsız arar (login akışı). */
  findByEmail(email: string): Promise<UserEntity | null>;
  save(user: UserEntity): Promise<void>;
  update(user: UserEntity): Promise<void>;
  listByCompany(companyId: string): Promise<UserEntity[]>;
  countActiveByCompany(companyId: string): Promise<number>;
}
