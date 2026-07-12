export type UnitError =
  | { code: "COMPANY_NOT_FOUND"; companyId: string }
  | { code: "COMPANY_INACTIVE"; companyId: string }
  | { code: "UNIT_GROUP_NOT_FOUND"; unitGroupId: string }
  | { code: "UNIT_GROUP_NAME_ALREADY_EXISTS"; companyId: string; name: string }
  | { code: "UNIT_GROUP_NOT_EMPTY"; unitGroupId: string }
  | { code: "UNIT_NOT_FOUND"; unitId: string }
  | { code: "UNIT_CODE_ALREADY_EXISTS"; companyId: string; unitCode: string }
  | { code: "BASE_UNIT_REQUIRED"; unitGroupId: string }
  | { code: "BASE_UNIT_CANNOT_BE_DEACTIVATED"; unitId: string }
  | { code: "BASE_UNIT_FACTOR_MUST_BE_ONE"; unitId: string };

export const UnitErrors = {
  companyNotFound: (companyId: string): UnitError => ({ code: "COMPANY_NOT_FOUND", companyId }),
  companyInactive: (companyId: string): UnitError => ({ code: "COMPANY_INACTIVE", companyId }),
  groupNotFound: (unitGroupId: string): UnitError => ({ code: "UNIT_GROUP_NOT_FOUND", unitGroupId }),
  groupNameExists: (companyId: string, name: string): UnitError => ({ code: "UNIT_GROUP_NAME_ALREADY_EXISTS", companyId, name }),
  groupNotEmpty: (unitGroupId: string): UnitError => ({ code: "UNIT_GROUP_NOT_EMPTY", unitGroupId }),
  unitNotFound: (unitId: string): UnitError => ({ code: "UNIT_NOT_FOUND", unitId }),
  unitCodeExists: (companyId: string, unitCode: string): UnitError => ({ code: "UNIT_CODE_ALREADY_EXISTS", companyId, unitCode }),
  baseUnitRequired: (unitGroupId: string): UnitError => ({ code: "BASE_UNIT_REQUIRED", unitGroupId }),
  baseUnitCannotDeactivate: (unitId: string): UnitError => ({ code: "BASE_UNIT_CANNOT_BE_DEACTIVATED", unitId }),
  baseUnitFactorMustBeOne: (unitId: string): UnitError => ({ code: "BASE_UNIT_FACTOR_MUST_BE_ONE", unitId }),
};
