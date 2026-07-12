import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IWarehouseRepository } from "../../../../domain/repositories/warehouse.repository.interface";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { ICurrencyReferenceRepository } from "../../../../domain/repositories/currency-reference.repository.interface";
import type { IBusinessPartnerReferenceRepository } from "../../../../domain/repositories/business-partner-reference.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { StockDocumentError } from "../../../../domain/errors/stock-document.errors";
import { StockDocumentErrors } from "../../../../domain/errors/stock-document.errors";
import { StockDocumentEntity } from "../../../../domain/entities/stock-document.entity";
import { StockMovementEntity } from "../../../../domain/entities/stock-movement.entity";
import type { MovementDirection } from "../../../../domain/entities/stock-movement.entity";
import type { DocumentType } from "../../../../domain/entities/stock-document.entity";
import { Decimal } from "../../../../domain/value-objects/decimal.vo";
import { CreateStockDocumentCommand } from "./create-stock-document.command";

// TRANSFER iki hareket üretir (kaynaktan OUT + hedefe IN); diğer türler tek yönlüdür.
// ADJUSTMENT pozitif miktarla giriş düzeltmesidir (negatif düzeltme için RETURN_OUT vb. kullanılır).
const DIRECTION_BY_TYPE: Record<Exclude<DocumentType, "TRANSFER">, MovementDirection> = {
  PURCHASE: "IN",
  RETURN_IN: "IN",
  PRODUCTION_IN: "IN",
  OPENING: "IN",
  ADJUSTMENT: "IN",
  SALE: "OUT",
  RETURN_OUT: "OUT",
  PRODUCTION_OUT: "OUT",
};

export class CreateStockDocumentHandler {
  constructor(
    private readonly stockDocumentRepository: IStockDocumentRepository,
    private readonly stockMovementRepository: IStockMovementRepository,
    private readonly productRepository: IProductRepository,
    private readonly warehouseRepository: IWarehouseRepository,
    private readonly companyReferenceRepository: ICompanyReferenceRepository,
    private readonly currencyReferenceRepository: ICurrencyReferenceRepository,
    private readonly businessPartnerReferenceRepository: IBusinessPartnerReferenceRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
  ) {}

  async execute(
    command: CreateStockDocumentCommand,
  ): Promise<{ id: string } | StockDocumentError> {
    return this.unitOfWork.run<{ id: string } | StockDocumentError>(async () => {
      // Reference (cache) tablolara hard FK yok; bütünlük burada doğrulanır.
      const company = await this.companyReferenceRepository.findById(
        command.companyId,
      );
      if (!company) {
        return StockDocumentErrors.companyNotFound(command.companyId);
      }
      if (!company.isActive) {
        return StockDocumentErrors.companyInactive(command.companyId);
      }

      const currency = await this.currencyReferenceRepository.findById(
        command.currencyId,
      );
      if (!currency) {
        return StockDocumentErrors.currencyNotFound(command.currencyId);
      }
      if (!currency.isActive) {
        return StockDocumentErrors.currencyInactive(command.currencyId);
      }

      const warehouse = await this.warehouseRepository.findById(
        command.warehouseId,
      );
      if (!warehouse || warehouse.companyId !== command.companyId) {
        return StockDocumentErrors.warehouseNotFound(command.warehouseId);
      }
      if (!warehouse.isActive) {
        return StockDocumentErrors.warehouseInactive(command.warehouseId);
      }

      if (command.partnerId) {
        const partner = await this.businessPartnerReferenceRepository.findById(
          command.partnerId,
        );
        if (
          !partner ||
          partner.companyId !== command.companyId ||
          !partner.isActive
        ) {
          return StockDocumentErrors.partnerNotFound(command.partnerId);
        }
        const requiredPartnerType =
          command.documentType === "PURCHASE" ||
          command.documentType === "RETURN_OUT"
            ? "SUPPLIER"
            : command.documentType === "SALE" ||
                command.documentType === "RETURN_IN"
              ? "CUSTOMER"
              : null;
        if (
          requiredPartnerType &&
          partner.type !== requiredPartnerType &&
          partner.type !== "BOTH"
        ) {
          return StockDocumentErrors.invalidPartnerType(
            command.partnerId,
            command.documentType,
          );
        }
      }

      if (command.documentType === "TRANSFER") {
        if (!command.targetWarehouseId) {
          return StockDocumentErrors.targetWarehouseRequired(command.documentType);
        }
        const target = await this.warehouseRepository.findById(
          command.targetWarehouseId,
        );
        if (!target || target.companyId !== command.companyId) {
          return StockDocumentErrors.warehouseNotFound(command.targetWarehouseId);
        }
        if (!target.isActive) {
          return StockDocumentErrors.warehouseInactive(command.targetWarehouseId);
        }
        if (target.id === command.warehouseId) {
          return StockDocumentErrors.targetWarehouseMustDiffer(target.id);
        }
      }

      const existing = await this.stockDocumentRepository.findByDocumentNumber(
        command.companyId,
        command.documentNumber,
      );
      if (existing) {
        return StockDocumentErrors.documentNumberAlreadyExists(
          command.companyId,
          command.documentNumber,
        );
      }

      const document = new StockDocumentEntity({
        id: crypto.randomUUID(),
        companyId: command.companyId,
        documentNumber: command.documentNumber,
        documentType: command.documentType,
        status: "DRAFT",
        warehouseId: command.warehouseId,
        targetWarehouseId: command.targetWarehouseId,
        partnerId: command.partnerId,
        currencyId: command.currencyId,
        exchangeRate: command.exchangeRate,
        documentDate: command.documentDate,
        notes: command.notes,
        createdBy: command.createdBy,
        createdAt: new Date(),
      });

      const movements: StockMovementEntity[] = [];
      const exchangeRate = Decimal.from(command.exchangeRate);
      let lineNumber = 0;

      for (const [inputIndex, line] of command.lines.entries()) {
        const product = await this.productRepository.findById(line.productId);
        if (!product || product.companyId !== command.companyId) {
          return StockDocumentErrors.productNotFound(line.productId);
        }
        if (!product.isActive) {
          return StockDocumentErrors.productInactive(line.productId);
        }

        // Şimdilik yalnızca ürünün temel birimi destekleniyor; birim çevrim
        // tabloları (product_units) bağlanana kadar farklı birim reddedilir.
        if (line.unitId !== product.baseUnitId) {
          return StockDocumentErrors.invalidUnitConversion(
            line.unitId,
            product.baseUnitId,
          );
        }

        const quantity = Decimal.from(line.quantity);
        const unitPrice = Decimal.from(line.unitPrice);
        const totalAmount = quantity.multiply(unitPrice);
        const totalAmountBase = totalAmount.multiply(exchangeRate);
        if (!totalAmount.fits(18, 4) || !totalAmountBase.fits(18, 4)) {
          return StockDocumentErrors.amountOutOfRange(inputIndex + 1);
        }

        const buildMovement = (
          direction: MovementDirection,
          warehouseId: string,
        ): StockMovementEntity =>
          new StockMovementEntity({
            id: crypto.randomUUID(),
            companyId: command.companyId,
            documentId: document.id,
            lineNumber: ++lineNumber,
            productId: line.productId,
            warehouseId,
            direction,
            unitId: line.unitId,
            quantity: quantity.toFixed(4),
            baseQuantity: quantity.toFixed(4),
            unitPrice: unitPrice.toFixed(4),
            currencyId: command.currencyId,
            exchangeRate: exchangeRate.toFixed(8),
            totalAmount: totalAmount.toFixed(4),
            totalAmountBaseCurrency: totalAmountBase.toFixed(4),
            notes: line.notes,
            createdAt: new Date(),
          });

        if (command.documentType === "TRANSFER") {
          movements.push(buildMovement("OUT", command.warehouseId));
          movements.push(buildMovement("IN", command.targetWarehouseId as string));
        } else {
          movements.push(
            buildMovement(
              DIRECTION_BY_TYPE[command.documentType],
              command.warehouseId,
            ),
          );
        }
      }

      await this.stockDocumentRepository.save(document);
      await this.stockMovementRepository.saveMany(movements);

      return { id: document.id };
    });
  }
}
