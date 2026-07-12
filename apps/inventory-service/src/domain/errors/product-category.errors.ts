export type ProductCategoryError =
  | { code: "COMPANY_NOT_FOUND"; companyId: string }
  | { code: "COMPANY_INACTIVE"; companyId: string }
  | { code: "PRODUCT_CATEGORY_NOT_FOUND"; categoryId: string }
  | { code: "CATEGORY_CYCLE_DETECTED"; categoryId: string };

export const ProductCategoryErrors = {
  companyNotFound: (companyId: string): ProductCategoryError => ({ code: "COMPANY_NOT_FOUND", companyId }),
  companyInactive: (companyId: string): ProductCategoryError => ({ code: "COMPANY_INACTIVE", companyId }),
  notFound: (categoryId: string): ProductCategoryError => ({ code: "PRODUCT_CATEGORY_NOT_FOUND", categoryId }),
  cycle: (categoryId: string): ProductCategoryError => ({ code: "CATEGORY_CYCLE_DETECTED", categoryId }),
};
