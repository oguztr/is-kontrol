import type { StockDocumentEntity } from "../../../domain/entities/stock-document.entity";
import type { StockMovementEntity } from "../../../domain/entities/stock-movement.entity";
import { StockDocumentErrors } from "../../../domain/errors/stock-document.errors";
import type { StockDocumentError } from "../../../domain/errors/stock-document.errors";
import type { ICompanyReferenceRepository } from "../../../domain/repositories/company-reference.repository.interface";
import type { ICurrencyReferenceRepository } from "../../../domain/repositories/currency-reference.repository.interface";
import type { IBusinessPartnerReferenceRepository } from "../../../domain/repositories/business-partner-reference.repository.interface";
import type { IWarehouseRepository } from "../../../domain/repositories/warehouse.repository.interface";
import type { IProductRepository } from "../../../domain/repositories/product.repository.interface";
import type { IProductUnitRepository } from "../../../domain/repositories/product-unit.repository.interface";
import { Decimal } from "../../../domain/value-objects/decimal.vo";

/** Doğrulama sonucu: hareket id'sine göre yeniden hesaplanmış taban miktarlar. */
export interface PostValidationOutcome {
  baseQuantities: Map<string, Decimal>;
}

const PARTNER_REQUIRED_TYPES = new Set([
  "PURCHASE",
  "SALE",
  "RETURN_IN",
  "RETURN_OUT",
]);

/* Kesinleştirme anında belge baştan doğrulanır: taslak, oluşturulduğundan bu
 * yana referanslar (şirket, depo, cari, para birimi, ürün, birim) pasifleşmiş
 * ya da silinmiş olabilir. Satır taban miktarları da kayıtlı değerlere
 * güvenilmeden ürün birim katsayısından yeniden hesaplanır. */
export class StockDocumentPostValidator {
  constructor(
    private readonly companies: ICompanyReferenceRepository,
    private readonly currencies: ICurrencyReferenceRepository,
    private readonly warehouses: IWarehouseRepository,
    private readonly partners: IBusinessPartnerReferenceRepository,
    private readonly products: IProductRepository,
    private readonly productUnits: IProductUnitRepository,
  ) {}

  async validate(
    document: StockDocumentEntity,
    movements: StockMovementEntity[],
  ): Promise<StockDocumentError | PostValidationOutcome> {
    const company = await this.companies.findById(document.companyId);
    if (!company) return StockDocumentErrors.companyNotFound(document.companyId);
    if (!company.isActive)
      return StockDocumentErrors.companyInactive(document.companyId);

    const currency = await this.currencies.findById(document.currencyId);
    if (!currency)
      return StockDocumentErrors.currencyNotFound(document.currencyId);
    if (!currency.isActive)
      return StockDocumentErrors.currencyInactive(document.currencyId);

    if (!Decimal.from(document.exchangeRate).isPositive)
      return StockDocumentErrors.invalidExchangeRate(document.exchangeRate);

    const warehouseError = await this.warehouseError(document);
    if (warehouseError) return warehouseError;

    const partnerError = await this.partnerError(document);
    if (partnerError) return partnerError;

    return this.lineError(document, movements);
  }

  private async warehouseError(
    document: StockDocumentEntity,
  ): Promise<StockDocumentError | undefined> {
    const warehouse = await this.warehouses.findById(document.warehouseId);
    if (!warehouse || warehouse.companyId !== document.companyId)
      return StockDocumentErrors.warehouseNotFound(document.warehouseId);
    if (!warehouse.isActive)
      return StockDocumentErrors.warehouseInactive(document.warehouseId);

    if (document.documentType === "TRANSFER") {
      if (!document.targetWarehouseId)
        return StockDocumentErrors.targetWarehouseRequired(
          document.documentType,
        );
      const target = await this.warehouses.findById(
        document.targetWarehouseId,
      );
      if (!target || target.companyId !== document.companyId)
        return StockDocumentErrors.warehouseNotFound(
          document.targetWarehouseId,
        );
      if (!target.isActive)
        return StockDocumentErrors.warehouseInactive(
          document.targetWarehouseId,
        );
      if (target.id === document.warehouseId)
        return StockDocumentErrors.targetWarehouseMustDiffer(target.id);
    }
    return undefined;
  }

  private async partnerError(
    document: StockDocumentEntity,
  ): Promise<StockDocumentError | undefined> {
    if (!document.partnerId) {
      return PARTNER_REQUIRED_TYPES.has(document.documentType)
        ? StockDocumentErrors.partnerRequired(document.documentType)
        : undefined;
    }
    const partner = await this.partners.findById(document.partnerId);
    if (
      !partner ||
      partner.companyId !== document.companyId ||
      !partner.isActive
    ) {
      return StockDocumentErrors.partnerNotFound(document.partnerId);
    }
    const requiredType =
      document.documentType === "PURCHASE" ||
      document.documentType === "RETURN_OUT"
        ? "SUPPLIER"
        : document.documentType === "SALE" ||
            document.documentType === "RETURN_IN"
          ? "CUSTOMER"
          : null;
    if (requiredType && partner.type !== requiredType && partner.type !== "BOTH") {
      return StockDocumentErrors.invalidPartnerType(
        document.partnerId,
        document.documentType,
      );
    }
    return undefined;
  }

  private async lineError(
    document: StockDocumentEntity,
    movements: StockMovementEntity[],
  ): Promise<StockDocumentError | PostValidationOutcome> {
    const baseQuantities = new Map<string, Decimal>();
    for (const movement of movements) {
      const product = await this.products.findById(movement.productId);
      if (!product || product.companyId !== document.companyId)
        return StockDocumentErrors.productNotFound(movement.productId);
      if (!product.isActive)
        return StockDocumentErrors.productInactive(movement.productId);

      let factor = Decimal.from("1");
      if (movement.unitId !== product.baseUnitId) {
        const productUnit = await this.productUnits.findByProductAndUnit(
          movement.productId,
          movement.unitId,
        );
        if (!productUnit)
          return StockDocumentErrors.invalidUnitConversion(
            movement.unitId,
            product.baseUnitId,
          );
        factor = Decimal.from(productUnit.conversionFactor);
      }

      const quantity = Decimal.from(movement.quantity);
      if (!quantity.isPositive)
        return StockDocumentErrors.invalidQuantity(movement.lineNumber);
      const unitPrice = Decimal.from(movement.unitPrice);
      if (unitPrice.isNegative)
        return StockDocumentErrors.invalidUnitPrice(movement.lineNumber);

      const baseQuantity = quantity.multiply(factor);
      const totalAmount = quantity.multiply(unitPrice);
      const totalAmountBase = totalAmount.multiply(
        Decimal.from(document.exchangeRate),
      );
      if (
        !baseQuantity.fits(18, 4) ||
        !totalAmount.fits(18, 4) ||
        !totalAmountBase.fits(18, 4)
      ) {
        return StockDocumentErrors.amountOutOfRange(movement.lineNumber);
      }
      baseQuantities.set(movement.id, baseQuantity);
    }
    return { baseQuantities };
  }
}
