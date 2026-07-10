import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { StockDocumentError } from "../../../../domain/errors/stock-document.errors";
import { StockDocumentErrors } from "../../../../domain/errors/stock-document.errors";
import { StockDocumentEntity } from "../../../../domain/entities/stock-document.entity";
import { CreateStockDocumentCommand } from "./create-stock-document.command";

export class CreateStockDocumentHandler {
  constructor(
    private readonly stockDocumentRepository: IStockDocumentRepository,
  ) {}

  async execute(
    command: CreateStockDocumentCommand,
  ): Promise<{ id: string } | StockDocumentError> {
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

    await this.stockDocumentRepository.save(document);

    return { id: document.id };
  }
}
