export type WarehouseError =
  | { code: "WAREHOUSE_NOT_FOUND"; warehouseId: string }
  | {
      code: "WAREHOUSE_CODE_ALREADY_EXISTS";
      companyId: string;
      warehouseCode: string;
    }
  | { code: "WAREHOUSE_INACTIVE"; warehouseId: string };

export const WarehouseErrors = {
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
};
