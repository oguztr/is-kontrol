import type { UserEntity } from "../../../domain/entities/user.entity";
import { UserErrors } from "../../../domain/errors/user.errors";
import type { UserError } from "../../../domain/errors/user.errors";
import type { IUserRepository } from "../../../domain/repositories/user.repository.interface";
import type { IEventPublisherPort } from "../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../ports/actor-context.port";
import { userSnapshotPayload } from "./user-event.payload";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

/* Kullanıcıyı kilitleyip değiştiren command handler'ların ortak gövdesi:
 * kapsam kontrolü ve event yayını tek yerde toplanır. */
export abstract class UserCommandHandlerBase {
  constructor(
    protected readonly users: IUserRepository,
    protected readonly eventPublisher: IEventPublisherPort,
    protected readonly unitOfWork: IUnitOfWorkPort,
    protected readonly actor: IActorContextPort,
  ) {}

  protected async mutateUser(
    id: string,
    change: (user: UserEntity) => Promise<UserError | undefined>,
  ): Promise<Result<void, UserError>> {
    const error = await this.unitOfWork.run<UserError | undefined>(
      async () => {
        const user = await this.users.findByIdForUpdate(id);
        if (!user || !this.actor.allowsCompany(user.companyId)) {
          return UserErrors.notFound(id);
        }
        return change(user);
      },
    );
    return error ? new Failure(error) : new Success(undefined);
  }

  protected async publishUserEvent(
    user: UserEntity,
    eventType: string,
    payload: Record<string, unknown> = userSnapshotPayload(user),
  ): Promise<void> {
    await this.eventPublisher.publish({
      aggregateType: "User",
      aggregateId: user.id,
      eventType,
      payload,
    });
  }
}
