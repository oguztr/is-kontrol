import { CompanyErrors } from "../../../../domain/errors/company.errors";
import type { CompanyError } from "../../../../domain/errors/company.errors";
import type { ICompanyRepository } from "../../../../domain/repositories/company.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { companyStatusPayload } from "../company-event.payload";
import { DeleteCompanyCommand } from "./delete-company.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

/* Soft delete (arşivleme). Tüketiciler ayrı bir "deleted" durumu tanımadığı
 * için dışarıya company.deactivated olarak yansır: cache'ler pasiflenir,
 * kayıt burada deleted_at ile saklanmaya devam eder. */
export class DeleteCompanyHandler {
  constructor(
    private readonly companies: ICompanyRepository,
    private readonly eventPublisher: IEventPublisherPort,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: DeleteCompanyCommand,
  ): Promise<Result<void, CompanyError>> {
    const error = await this.unitOfWork.run<CompanyError | undefined>(
      async () => {
        const company = await this.companies.findByIdForUpdate(
          command.companyId,
        );
        if (!company || !this.actor.allowsCompany(company.id)) {
          return CompanyErrors.notFound(command.companyId);
        }
        company.softDelete();
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
