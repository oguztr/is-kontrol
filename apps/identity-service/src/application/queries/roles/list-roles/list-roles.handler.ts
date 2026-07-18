import { CompanyErrors } from "../../../../domain/errors/company.errors";
import type { CompanyError } from "../../../../domain/errors/company.errors";
import type { IRoleRepository } from "../../../../domain/repositories/role.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { ListRolesQuery } from "./list-roles.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export interface RoleView {
  id: string;
  code: string;
  name: string;
  isSystem: boolean;
  permissions: string[];
}

export class ListRolesHandler {
  constructor(
    private readonly roles: IRoleRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: ListRolesQuery,
  ): Promise<Result<RoleView[], CompanyError>> {
    if (!this.actor.allowsCompany(query.companyId)) {
      return new Failure(CompanyErrors.notFound(query.companyId));
    }
    const roles = await this.roles.listForCompany(query.companyId);
    return new Success(
      roles.map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        isSystem: role.isSystem,
        permissions: role.permissions,
      })),
    );
  }
}
