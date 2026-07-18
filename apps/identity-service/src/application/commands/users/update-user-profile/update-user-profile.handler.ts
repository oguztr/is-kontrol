import type { UserError } from "../../../../domain/errors/user.errors";
import { UserCommandHandlerBase } from "../user-command.base";
import { UpdateUserProfileCommand } from "./update-user-profile.command";
import { Result } from "@is-kontrol/shared-result";

export class UpdateUserProfileHandler extends UserCommandHandlerBase {
  async execute(
    command: UpdateUserProfileCommand,
  ): Promise<Result<void, UserError>> {
    return this.mutateUser(command.userId, async (user) => {
      user.firstName = command.firstName ?? user.firstName;
      user.lastName = command.lastName ?? user.lastName;
      user.phone = command.phone ?? user.phone;
      user.avatarUrl = command.avatarUrl ?? user.avatarUrl;
      await this.users.update(user);
      await this.publishUserEvent(user, "user.updated");
      return undefined;
    });
  }
}
