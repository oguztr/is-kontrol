import type { IProductRepository } from "../../../domain/repositories/product.repository.interface";
import type { IProductUnitRepository } from "../../../domain/repositories/product-unit.repository.interface";
import { StockMovementEntity } from "../../../domain/entities/stock-movement.entity";
import type { MovementDirection } from "../../../domain/entities/stock-movement.entity";
import type { DocumentType } from "../../../domain/entities/stock-document.entity";
import { StockDocumentErrors } from "../../../domain/errors/stock-document.errors";
import type { StockDocumentError } from "../../../domain/errors/stock-document.errors";
import { Decimal } from "../../../domain/value-objects/decimal.vo";

export interface DocumentLineInput {
  productId: string;
  unitId: string;
  quantity: string;
  unitPrice: string;
  notes: string | null;
}

export interface DocumentLineContext {
  documentId: string;
  companyId: string;
  documentType: DocumentType;
  warehouseId: string;
  targetWarehouseId: string | null;
  currencyId: string;
  exchangeRate: string;
}

// TRANSFER iki hareket üretir (kaynaktan OUT + hedefe IN); diğer türler tek yönlüdür.
// ADJUSTMENT artış, ADJUSTMENT_OUT azalış düzeltmesidir.
const DIRECTION_BY_TYPE: Record<
  Exclude<DocumentType, "TRANSFER">,
  MovementDirection
> = {
  PURCHASE: "IN",
  RETURN_IN: "IN",
  PRODUCTION_IN: "IN",
  OPENING: "IN",
  ADJUSTMENT: "IN",
  ADJUSTMENT_OUT: "OUT",
  SALE: "OUT",
  RETURN_OUT: "OUT",
  PRODUCTION_OUT: "OUT",
};

/* Belge satırlarını doğrulayıp hareket kayıtlarına çevirir; hem belge
 * oluşturma hem de taslak satır işlemleri aynı kuralları buradan kullanır.
 * Birim çevrimi: ana birim 1 katsayı, alternatif birimler product_units
 * tablosundaki ürün bazlı katsayı ile taban miktara çevrilir. */
export class StockDocumentLineBuilder {
  constructor(
    private readonly products: IProductRepository,
    private readonly productUnits: IProductUnitRepository,
  ) {}

  async build(
    context: DocumentLineContext,
    lines: DocumentLineInput[],
    startLineNumber = 0,
  ): Promise<StockMovementEntity[] | StockDocumentError> {
    const movements: StockMovementEntity[] = [];
    const exchangeRate = Decimal.from(context.exchangeRate);
    let lineNumber = startLineNumber;

    for (const [inputIndex, line] of lines.entries()) {
      const product = await this.products.findById(line.productId);
      if (!product || product.companyId !== context.companyId) {
        return StockDocumentErrors.productNotFound(line.productId);
      }
      if (!product.isActive) {
        return StockDocumentErrors.productInactive(line.productId);
      }

      let factor = Decimal.from("1");
      if (line.unitId !== product.baseUnitId) {
        const productUnit = await this.productUnits.findByProductAndUnit(
          line.productId,
          line.unitId,
        );
        if (!productUnit) {
          return StockDocumentErrors.invalidUnitConversion(
            line.unitId,
            product.baseUnitId,
          );
        }
        factor = Decimal.from(productUnit.conversionFactor);
      }

      const quantity = Decimal.from(line.quantity);
      const baseQuantity = quantity.multiply(factor);
      const unitPrice = Decimal.from(line.unitPrice);
      const totalAmount = quantity.multiply(unitPrice);
      const totalAmountBase = totalAmount.multiply(exchangeRate);
      if (
        !baseQuantity.fits(18, 4) ||
        !totalAmount.fits(18, 4) ||
        !totalAmountBase.fits(18, 4)
      ) {
        return StockDocumentErrors.amountOutOfRange(inputIndex + 1);
      }

      const buildMovement = (
        direction: MovementDirection,
        warehouseId: string,
      ): StockMovementEntity =>
        new StockMovementEntity({
          id: crypto.randomUUID(),
          companyId: context.companyId,
          documentId: context.documentId,
          lineNumber: ++lineNumber,
          productId: line.productId,
          warehouseId,
          direction,
          unitId: line.unitId,
          quantity: quantity.toFixed(4),
          baseQuantity: baseQuantity.toFixed(4),
          unitPrice: unitPrice.toFixed(4),
          currencyId: context.currencyId,
          exchangeRate: exchangeRate.toFixed(8),
          totalAmount: totalAmount.toFixed(4),
          totalAmountBaseCurrency: totalAmountBase.toFixed(4),
          notes: line.notes,
          createdAt: new Date(),
        });

      if (context.documentType === "TRANSFER") {
        movements.push(buildMovement("OUT", context.warehouseId));
        movements.push(
          buildMovement("IN", context.targetWarehouseId as string),
        );
      } else {
        movements.push(
          buildMovement(
            DIRECTION_BY_TYPE[context.documentType],
            context.warehouseId,
          ),
        );
      }
    }

    return movements;
  }
}
