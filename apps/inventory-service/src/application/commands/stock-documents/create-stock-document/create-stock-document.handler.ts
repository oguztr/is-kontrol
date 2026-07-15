import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import type { IWarehouseRepository } from "../../../../domain/repositories/warehouse.repository.interface";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { ICurrencyReferenceRepository } from "../../../../domain/repositories/currency-reference.repository.interface";
import type { IBusinessPartnerReferenceRepository } from "../../../../domain/repositories/business-partner-reference.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { StockDocumentError } from "../../../../domain/errors/stock-document.errors";
import { StockDocumentErrors } from "../../../../domain/errors/stock-document.errors";
import { StockDocumentEntity } from "../../../../domain/entities/stock-document.entity";
import { StockDocumentLineBuilder } from "../stock-document-line.builder";
import { CreateStockDocumentCommand } from "./create-stock-document.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class CreateStockDocumentHandler {
  constructor(
    private readonly stockDocumentRepository: IStockDocumentRepository,
    private readonly stockMovementRepository: IStockMovementRepository,
    private readonly lineBuilder: StockDocumentLineBuilder,
    private readonly warehouseRepository: IWarehouseRepository,
    private readonly companyReferenceRepository: ICompanyReferenceRepository,
    private readonly currencyReferenceRepository: ICurrencyReferenceRepository,
    private readonly businessPartnerReferenceRepository: IBusinessPartnerReferenceRepository,
    private readonly eventPublisher: IEventPublisherPort,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: CreateStockDocumentCommand,
  ): Promise<Result<{ id: string }, StockDocumentError>> {
    const outcome = await this.unitOfWork.run<
      { id: string } | StockDocumentError
    >(async () => {
      // Şirket izolasyonu: aktör yalnızca kendi şirketi adına belge açabilir.
      if (!this.actor.allowsCompany(command.companyId)) {
        return StockDocumentErrors.companyNotFound(command.companyId);
      }
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
          return StockDocumentErrors.targetWarehouseRequired(
            command.documentType,
          );
        }
        const target = await this.warehouseRepository.findById(
          command.targetWarehouseId,
        );
        if (!target || target.companyId !== command.companyId) {
          return StockDocumentErrors.warehouseNotFound(
            command.targetWarehouseId,
          );
        }
        if (!target.isActive) {
          return StockDocumentErrors.warehouseInactive(
            command.targetWarehouseId,
          );
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
        // Kimliği doğrulanmış kullanıcı (x-user-id) body'deki değere yeğlenir.
        createdBy: this.actor.userId() ?? command.createdBy,
        createdAt: new Date(),
      });

      const movements = await this.lineBuilder.build(
        {
          documentId: document.id,
          companyId: command.companyId,
          documentType: command.documentType,
          warehouseId: command.warehouseId,
          targetWarehouseId: command.targetWarehouseId,
          currencyId: command.currencyId,
          exchangeRate: command.exchangeRate,
        },
        command.lines,
      );
      if (!Array.isArray(movements)) {
        return movements;
      }

      const inserted = await this.stockDocumentRepository.save(document);
      if (!inserted) {
        return StockDocumentErrors.documentNumberAlreadyExists(
          command.companyId,
          command.documentNumber,
        );
      }
      await this.stockMovementRepository.saveMany(movements);

      await this.eventPublisher.publish({
        aggregateType: "StockDocument",
        aggregateId: document.id,
        eventType: "stock.document.created",
        payload: {
          documentId: document.id,
          documentNumber: document.documentNumber,
          documentType: document.documentType,
          companyId: document.companyId,
          occurredAt: new Date().toISOString(),
        },
      });

      return { id: document.id };
    });
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }
}
