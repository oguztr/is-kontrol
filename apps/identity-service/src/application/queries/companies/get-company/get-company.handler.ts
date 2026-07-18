import { CompanyErrors } from "../../../../domain/errors/company.errors";
import type { CompanyError } from "../../../../domain/errors/company.errors";
import type { ICompanyRepository } from "../../../../domain/repositories/company.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { GetCompanyQuery } from "./get-company.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export interface CompanyView {
  id: string;
  name: string;
  baseCurrencyCode: string;
  timezone: string;
  locale: string;
  status: string;
  planTier: string;
  maxUsers: number | null;
  createdAt: Date;
}

export class GetCompanyHandler {
  constructor(
    private readonly companies: ICompanyRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetCompanyQuery,
  ): Promise<Result<CompanyView, CompanyError>> {
    const company = await this.companies.findById(query.companyId);
    if (!company || !this.actor.allowsCompany(company.id)) {
      return new Failure(CompanyErrors.notFound(query.companyId));
    }
    return new Success({
      id: company.id,
      name: company.name,
      baseCurrencyCode: company.baseCurrencyCode,
      timezone: company.timezone,
      locale: company.locale,
      status: company.status,
      planTier: company.planTier,
      maxUsers: company.maxUsers,
      createdAt: company.createdAt,
    });
  }
}
