import { UserErrors } from "../../../../domain/errors/user.errors";
import type { UserError } from "../../../../domain/errors/user.errors";
import type { IUserRepository } from "../../../../domain/repositories/user.repository.interface";
import type { IRoleRepository } from "../../../../domain/repositories/role.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { UserCommandHandlerBase } from "../user-command.base";
import { AssignRoleCommand } from "./assign-role.command";
import { Result } from "@is-kontrol/shared-result";

/* Rol değişikliği mevcut access token'ları geçersiz kılmaz; yeni izinler en
 * geç bir sonraki token yenilemede (≤15 dk) etkili olur. */
export class AssignRoleHandler extends UserCommandHandlerBase {
  constructor(
    users: IUserRepository,
    eventPublisher: IEventPublisherPort,
    unitOfWork: IUnitOfWorkPort,
    actor: IActorContextPort,
    private readonly roles: IRoleRepository,
  ) {
    super(users, eventPublisher, unitOfWork, actor);
  }

  async execute(command: AssignRoleCommand): Promise<Result<void, UserError>> {
    return this.mutateUser(command.userId, async (user) => {
      const role = await this.roles.findById(command.roleId);
      if (!role || !role.assignableTo(user.companyId)) {
        return UserErrors.roleNotFound(command.roleId);
      }
      user.roleId = role.id;
      await this.users.update(user);
      await this.publishUserEvent(user, "user.role-changed");
      return undefined;
    });
  }
}
