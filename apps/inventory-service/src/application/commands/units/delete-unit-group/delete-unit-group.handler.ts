import { UnitErrors } from "../../../../domain/errors/unit.errors";
import type { UnitError } from "../../../../domain/errors/unit.errors";
import type { IUnitRepository } from "../../../../domain/repositories/unit.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { DeleteUnitGroupCommand } from "./delete-unit-group.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class DeleteUnitGroupHandler {
  constructor(
    private readonly units: IUnitRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: DeleteUnitGroupCommand,
  ): Promise<Result<void, UnitError>> {
    const error = await this.unitOfWork.run<UnitError | undefined>(async () => {
      const group = await this.units.findGroupById(command.id);
      if (!group || !this.actor.allowsCompany(group.companyId))
        return UnitErrors.groupNotFound(command.id);
      if (await this.units.groupHasUnits(command.id))
        return UnitErrors.groupNotEmpty(command.id);
      group.delete(new Date());
      await this.units.updateGroup(group);
      return undefined;
    });
    return error ? new Failure(error) : new Success(undefined);
  }
}
