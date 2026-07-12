import { HttpException, HttpStatus } from '@nestjs/common';
import type { ProductError } from '../../domain/errors/product.errors';
import type { StockDocumentError } from '../../domain/errors/stock-document.errors';
import type { WarehouseError } from '../../domain/errors/warehouse.errors';
import type { UnitError } from '../../domain/errors/unit.errors';
import type { ProductCategoryError } from '../../domain/errors/product-category.errors';
import type { Result } from '../../application/result';

export type InventoryDomainError =
  | ProductError
  | ProductCategoryError
  | StockDocumentError
  | UnitError
  | WarehouseError;

// Body içindeki referanslar çözülemediğinde 422, kaynak çakışmalarında 409,
// path ile adreslenen kaynak yoksa 404 döner.
const STATUS_BY_CODE: Readonly<Record<InventoryDomainError['code'], HttpStatus>> = {
  COMPANY_NOT_FOUND: HttpStatus.UNPROCESSABLE_ENTITY,
  COMPANY_INACTIVE: HttpStatus.UNPROCESSABLE_ENTITY,
  BASE_UNIT_NOT_FOUND: HttpStatus.UNPROCESSABLE_ENTITY,
  CATEGORY_NOT_FOUND: HttpStatus.UNPROCESSABLE_ENTITY,
  PRODUCT_CATEGORY_NOT_FOUND: HttpStatus.NOT_FOUND,
  CURRENCY_NOT_FOUND: HttpStatus.UNPROCESSABLE_ENTITY,
  CURRENCY_INACTIVE: HttpStatus.UNPROCESSABLE_ENTITY,
  WAREHOUSE_NOT_FOUND: HttpStatus.UNPROCESSABLE_ENTITY,
  PARTNER_NOT_FOUND: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_PARTNER_TYPE: HttpStatus.UNPROCESSABLE_ENTITY,
  TARGET_WAREHOUSE_REQUIRED: HttpStatus.UNPROCESSABLE_ENTITY,
  TARGET_WAREHOUSE_MUST_DIFFER: HttpStatus.UNPROCESSABLE_ENTITY,
  PRODUCT_NOT_FOUND: HttpStatus.UNPROCESSABLE_ENTITY,
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
  INSUFFICIENT_STOCK: HttpStatus.CONFLICT,
  DOCUMENT_NOT_FOUND: HttpStatus.NOT_FOUND,
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

function isDomainError(value: unknown): value is InventoryDomainError {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { code?: unknown }).code === 'string' &&
    (value as { code: string }).code in STATUS_BY_CODE
  );
}

export function domainErrorToHttpStatus(
  error: InventoryDomainError,
): HttpStatus {
  return STATUS_BY_CODE[error.code];
}

/** Handler sonucunu döner; domain hatasıysa uygun HTTP hatasına çevirir. */
export function unwrapDomainResult<T>(result: Result<T, InventoryDomainError>): T {
  return result.match(
    (value) => value,
    (error) => {
      if (!isDomainError(error)) {
        throw new HttpException(
          { code: 'UNKNOWN_DOMAIN_ERROR' },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(error, domainErrorToHttpStatus(error));
    },
  );
}
