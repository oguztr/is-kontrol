import { HttpStatus } from "@nestjs/common";
import { DomainResultInterceptor } from "@is-kontrol/shared-interceptors";
import type { ProductError } from "../../domain/errors/product.errors";
import type { StockDocumentError } from "../../domain/errors/stock-document.errors";
import type { WarehouseError } from "../../domain/errors/warehouse.errors";
import type { UnitError } from "../../domain/errors/unit.errors";
import type { ProductCategoryError } from "../../domain/errors/product-category.errors";
import type { ProductUnitError } from "../../domain/errors/product-unit.errors";
import type { StockBalanceError } from "../../domain/errors/stock-balance.errors";

export type InventoryDomainError =
  | ProductError
  | ProductCategoryError
  | ProductUnitError
  | StockBalanceError
  | StockDocumentError
  | UnitError
  | WarehouseError;

// Body içindeki referanslar çözülemediğinde 422, kaynak çakışmalarında 409,
// path ile adreslenen kaynak yoksa 404 döner.
const STATUS_BY_CODE: Readonly<
  Record<InventoryDomainError["code"], HttpStatus>
> = {
  COMPANY_NOT_FOUND: HttpStatus.UNPROCESSABLE_ENTITY,
  COMPANY_INACTIVE: HttpStatus.UNPROCESSABLE_ENTITY,
  BASE_UNIT_NOT_FOUND: HttpStatus.UNPROCESSABLE_ENTITY,
  CATEGORY_NOT_FOUND: HttpStatus.UNPROCESSABLE_ENTITY,
  PRODUCT_CATEGORY_NOT_FOUND: HttpStatus.NOT_FOUND,
  CURRENCY_NOT_FOUND: HttpStatus.UNPROCESSABLE_ENTITY,
  CURRENCY_INACTIVE: HttpStatus.UNPROCESSABLE_ENTITY,
  DOCUMENT_WAREHOUSE_NOT_FOUND: HttpStatus.UNPROCESSABLE_ENTITY,
  PARTNER_NOT_FOUND: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_PARTNER_TYPE: HttpStatus.UNPROCESSABLE_ENTITY,
  TARGET_WAREHOUSE_REQUIRED: HttpStatus.UNPROCESSABLE_ENTITY,
  PARTNER_REQUIRED: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_EXCHANGE_RATE: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_QUANTITY: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_UNIT_PRICE: HttpStatus.UNPROCESSABLE_ENTITY,
  TARGET_WAREHOUSE_MUST_DIFFER: HttpStatus.UNPROCESSABLE_ENTITY,
  LINE_PRODUCT_NOT_FOUND: HttpStatus.UNPROCESSABLE_ENTITY,
  PRODUCT_INACTIVE: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_UNIT_CONVERSION: HttpStatus.UNPROCESSABLE_ENTITY,
  DOCUMENT_HAS_NO_LINES: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_STOCK_LEVEL_RANGE: HttpStatus.UNPROCESSABLE_ENTITY,
  AMOUNT_OUT_OF_RANGE: HttpStatus.UNPROCESSABLE_ENTITY,
  BALANCE_OUT_OF_RANGE: HttpStatus.CONFLICT,
  PRODUCT_SKU_ALREADY_EXISTS: HttpStatus.CONFLICT,
  PRODUCT_BARCODE_ALREADY_EXISTS: HttpStatus.CONFLICT,
  PRODUCT_ARCHIVED: HttpStatus.CONFLICT,
  PRODUCT_HAS_STOCK_MOVEMENTS: HttpStatus.CONFLICT,
  BASE_UNIT_CHANGE_HAS_MOVEMENTS: HttpStatus.CONFLICT,
  CATEGORY_CYCLE_DETECTED: HttpStatus.CONFLICT,
  DOCUMENT_NUMBER_ALREADY_EXISTS: HttpStatus.CONFLICT,
  DOCUMENT_ALREADY_POSTED: HttpStatus.CONFLICT,
  DOCUMENT_ALREADY_CANCELLED: HttpStatus.CONFLICT,
  OPENING_ALREADY_EXISTS: HttpStatus.CONFLICT,
  INSUFFICIENT_STOCK: HttpStatus.CONFLICT,
  DOCUMENT_NOT_FOUND: HttpStatus.NOT_FOUND,
  MOVEMENT_NOT_FOUND: HttpStatus.NOT_FOUND,
  LINE_NOT_FOUND: HttpStatus.NOT_FOUND,
  PRODUCT_NOT_FOUND: HttpStatus.NOT_FOUND,
  WAREHOUSE_NOT_FOUND: HttpStatus.NOT_FOUND,
  PRODUCT_UNIT_NOT_FOUND: HttpStatus.NOT_FOUND,
  PRODUCT_UNIT_ALREADY_EXISTS: HttpStatus.CONFLICT,
  BASE_UNIT_CANNOT_BE_REMOVED: HttpStatus.CONFLICT,
  WAREHOUSE_CODE_ALREADY_EXISTS: HttpStatus.CONFLICT,
  WAREHOUSE_INACTIVE: HttpStatus.UNPROCESSABLE_ENTITY,
  WAREHOUSE_HAS_STOCK: HttpStatus.CONFLICT,
  UNIT_GROUP_NOT_FOUND: HttpStatus.NOT_FOUND,
  UNIT_GROUP_NAME_ALREADY_EXISTS: HttpStatus.CONFLICT,
  UNIT_GROUP_NOT_EMPTY: HttpStatus.CONFLICT,
  UNIT_NOT_FOUND: HttpStatus.NOT_FOUND,
  UNIT_CODE_ALREADY_EXISTS: HttpStatus.CONFLICT,
  BASE_UNIT_REQUIRED: HttpStatus.UNPROCESSABLE_ENTITY,
  BASE_UNIT_CANNOT_BE_DEACTIVATED: HttpStatus.CONFLICT,
  BASE_UNIT_FACTOR_MUST_BE_ONE: HttpStatus.UNPROCESSABLE_ENTITY,
};

export function domainErrorToHttpStatus(
  error: InventoryDomainError,
): HttpStatus {
  return STATUS_BY_CODE[error.code];
}

/* Envanter hata kodlarını HTTP durumlarına bağlayan hazır interceptor.
 * Controller sınıfına `@UseInterceptors(InventoryDomainResultInterceptor)`
 * eklenir; handler'lar use case'in döndürdüğü Result'ı olduğu gibi döner. */
export class InventoryDomainResultInterceptor extends DomainResultInterceptor {
  constructor() {
    super(STATUS_BY_CODE);
  }
}
