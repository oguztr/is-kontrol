import type { UserError } from "../../../../domain/errors/user.errors";
import type { IUserRepository } from "../../../../domain/repositories/user.repository.interface";
import type { IRefreshTokenRepository } from "../../../../domain/repositories/refresh-token.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { UserCommandHandlerBase } from "../user-command.base";
import { DeactivateUserCommand } from "./deactivate-user.command";
import { Result } from "@is-kontrol/shared-result";

export class DeactivateUserHandler extends UserCommandHandlerBase {
  constructor(
    users: IUserRepository,
    eventPublisher: IEventPublisherPort,
    unitOfWork: IUnitOfWorkPort,
    actor: IActorContextPort,
    private readonly refreshTokens: IRefreshTokenRepository,
  ) {
    super(users, eventPublisher, unitOfWork, actor);
  }

  async execute(
    command: DeactivateUserCommand,
  ): Promise<Result<void, UserError>> {
    return this.mutateUser(command.userId, async (user) => {
      user.deactivate();
      await this.users.update(user);
      // Oturumlar hemen kapanır; access token en fazla TTL kadar yaşar.
      await this.refreshTokens.revokeAllForUser(user.id);
      await this.publishUserEvent(user, "user.deactivated");
      return undefined;
    });
  }
}
