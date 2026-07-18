export type CompanyError =
  | { code: 'COMPANY_NOT_FOUND'; companyId: string }
  | { code: 'COMPANY_ALREADY_SUSPENDED'; companyId: string }
  | { code: 'COMPANY_NOT_SUSPENDED'; companyId: string };

export const CompanyErrors = {
  notFound: (companyId: string): CompanyError =>
    ({ code: 'COMPANY_NOT_FOUND', companyId }),

  alreadySuspended: (companyId: string): CompanyError =>
    ({ code: 'COMPANY_ALREADY_SUSPENDED', companyId }),

  notSuspended: (companyId: string): CompanyError =>
    ({ code: 'COMPANY_NOT_SUSPENDED', companyId }),
};
