import { CompanyErrors } from "../../../../domain/errors/company.errors";
import type { CompanyError } from "../../../../domain/errors/company.errors";
import type { ICompanyRepository } from "../../../../domain/repositories/company.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { companyStatusPayload } from "../company-event.payload";
import { SuspendCompanyCommand } from "./suspend-company.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

/* Askıya alma anlık kesinti gerektirmez: mevcut access token'lar en fazla
 * TTL (15 dk) kadar yaşar, refresh akışı firma durumunu kontrol ettiği için
 * yenilenemez. Tüketen servisler company.deactivated ile cache'lerini
 * pasifler ve o firmanın işlemlerini durdurabilir. */
export class SuspendCompanyHandler {
  constructor(
    private readonly companies: ICompanyRepository,
    private readonly eventPublisher: IEventPublisherPort,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: SuspendCompanyCommand,
  ): Promise<Result<void, CompanyError>> {
    const error = await this.unitOfWork.run<CompanyError | undefined>(
      async () => {
        const company = await this.companies.findByIdForUpdate(
          command.companyId,
        );
        if (!company || !this.actor.allowsCompany(company.id)) {
          return CompanyErrors.notFound(command.companyId);
        }
        if (company.status === "SUSPENDED") {
          return CompanyErrors.alreadySuspended(company.id);
        }
        company.suspend();
        await this.companies.update(company);

        await this.eventPublisher.publish({
          aggregateType: "Company",
          aggregateId: company.id,
          eventType: "company.deactivated",
          payload: companyStatusPayload(company),
        });
        return undefined;
      },
    );
    return error ? new Failure(error) : new Success(undefined);
  }
}
