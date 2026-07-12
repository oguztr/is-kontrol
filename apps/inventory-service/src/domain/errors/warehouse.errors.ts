export type WarehouseError =
  | { code: "WAREHOUSE_NOT_FOUND"; warehouseId: string }
  | {
      code: "WAREHOUSE_CODE_ALREADY_EXISTS";
      companyId: string;
      warehouseCode: string;
    }
  | { code: "WAREHOUSE_INACTIVE"; warehouseId: string }
  | { code: "COMPANY_NOT_FOUND"; companyId: string }
  | { code: "COMPANY_INACTIVE"; companyId: string }
  | { code: "WAREHOUSE_HAS_STOCK"; warehouseId: string };

export const WarehouseErrors = {
  companyNotFound: (companyId: string): WarehouseError => ({ code: "COMPANY_NOT_FOUND", companyId }),
  companyInactive: (companyId: string): WarehouseError => ({ code: "COMPANY_INACTIVE", companyId }),
  notFound: (warehouseId: string): WarehouseError => ({
    code: "WAREHOUSE_NOT_FOUND",
    warehouseId,
  }),

  codeAlreadyExists: (
    companyId: string,
    warehouseCode: string,
  ): WarehouseError => ({
    code: "WAREHOUSE_CODE_ALREADY_EXISTS",
    companyId,
    warehouseCode,
  }),

  inactive: (warehouseId: string): WarehouseError => ({
    code: "WAREHOUSE_INACTIVE",
    warehouseId,
  }),
  hasStock: (warehouseId: string): WarehouseError => ({ code: "WAREHOUSE_HAS_STOCK", warehouseId }),
};
