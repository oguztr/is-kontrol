export type PartnerError =
  | { code: 'COMPANY_NOT_FOUND'; companyId: string }
  | { code: 'COMPANY_INACTIVE'; companyId: string }
  | { code: 'PARTNER_NOT_FOUND'; partnerId: string }
  | { code: 'PARTNER_TYPE_NARROWING_NOT_ALLOWED'; partnerId: string; from: string; to: string }
  | { code: 'SALES_FUNNEL_NOT_APPLICABLE'; partnerId: string; type: string }
  | { code: 'PARTNER_NOT_CORPORATE'; partnerId: string }
  | { code: 'PARENT_PARTNER_NOT_FOUND'; partnerId: string }
  | { code: 'PARENT_PARTNER_CYCLE'; partnerId: string }
  | { code: 'MERGE_SOURCE_NOT_FOUND'; partnerId: string }
  | { code: 'MERGE_SAME_PARTNER'; partnerId: string }
  | { code: 'MERGE_COMPANY_MISMATCH'; survivorId: string; sourceId: string };

export const PartnerErrors = {
  companyNotFound: (companyId: string): PartnerError =>
    ({ code: 'COMPANY_NOT_FOUND', companyId }),

  companyInactive: (companyId: string): PartnerError =>
    ({ code: 'COMPANY_INACTIVE', companyId }),

  notFound: (partnerId: string): PartnerError =>
    ({ code: 'PARTNER_NOT_FOUND', partnerId }),

  typeNarrowingNotAllowed: (partnerId: string, from: string, to: string): PartnerError =>
    ({ code: 'PARTNER_TYPE_NARROWING_NOT_ALLOWED', partnerId, from, to }),

  salesFunnelNotApplicable: (partnerId: string, type: string): PartnerError =>
    ({ code: 'SALES_FUNNEL_NOT_APPLICABLE', partnerId, type }),

  notCorporate: (partnerId: string): PartnerError =>
    ({ code: 'PARTNER_NOT_CORPORATE', partnerId }),

  parentNotFound: (partnerId: string): PartnerError =>
    ({ code: 'PARENT_PARTNER_NOT_FOUND', partnerId }),

  parentCycle: (partnerId: string): PartnerError =>
    ({ code: 'PARENT_PARTNER_CYCLE', partnerId }),

  mergeSourceNotFound: (partnerId: string): PartnerError =>
    ({ code: 'MERGE_SOURCE_NOT_FOUND', partnerId }),

  mergeSamePartner: (partnerId: string): PartnerError =>
    ({ code: 'MERGE_SAME_PARTNER', partnerId }),

  mergeCompanyMismatch: (survivorId: string, sourceId: string): PartnerError =>
    ({ code: 'MERGE_COMPANY_MISMATCH', survivorId, sourceId }),
};
