import { CompanyErrors } from "../../../../domain/errors/company.errors";
import type { CompanyError } from "../../../../domain/errors/company.errors";
import type { IUserRepository } from "../../../../domain/repositories/user.repository.interface";
import type { IRoleRepository } from "../../../../domain/repositories/role.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { ListUsersQuery } from "./list-users.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  roleId: string;
  roleCode: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export class ListUsersHandler {
  constructor(
    private readonly users: IUserRepository,
    private readonly roles: IRoleRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: ListUsersQuery,
  ): Promise<Result<UserListItem[], CompanyError>> {
    if (!this.actor.allowsCompany(query.companyId)) {
      return new Failure(CompanyErrors.notFound(query.companyId));
    }
    const [users, roles] = await Promise.all([
      this.users.listByCompany(query.companyId),
      this.roles.listForCompany(query.companyId),
    ]);
    const roleCodeById = new Map(roles.map((role) => [role.id, role.code]));
    return new Success(
      users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        status: user.status,
        roleId: user.roleId,
        roleCode: roleCodeById.get(user.roleId) ?? null,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      })),
    );
  }
}
