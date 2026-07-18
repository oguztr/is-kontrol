import type { UserError } from "../../../../domain/errors/user.errors";
import { UserCommandHandlerBase } from "../user-command.base";
import { ReactivateUserCommand } from "./reactivate-user.command";
import { Result } from "@is-kontrol/shared-result";

export class ReactivateUserHandler extends UserCommandHandlerBase {
  async execute(
    command: ReactivateUserCommand,
  ): Promise<Result<void, UserError>> {
    return this.mutateUser(command.userId, async (user) => {
      user.reactivate();
      await this.users.update(user);
      await this.publishUserEvent(user, "user.activated");
      return undefined;
    });
  }
}
