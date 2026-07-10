import type { IStockDocumentRepository } from "../../../../domain/repositories/stock-document.repository.interface";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import type { IStockBalanceRepository } from "../../../../domain/repositories/stock-balance.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { StockDocumentError } from "../../../../domain/errors/stock-document.errors";
import { StockDocumentErrors } from "../../../../domain/errors/stock-document.errors";
import { StockBalanceEntity } from "../../../../domain/entities/stock-balance.entity";
import { PostStockDocumentCommand } from "./post-stock-document.command";

export class PostStockDocumentHandler {
  constructor(
    private readonly stockDocumentRepository: IStockDocumentRepository,
    private readonly stockMovementRepository: IStockMovementRepository,
    private readonly stockBalanceRepository: IStockBalanceRepository,
    private readonly eventPublisher: IEventPublisherPort,
    private readonly unitOfWork: IUnitOfWorkPort,
  ) {}

  async execute(
    command: PostStockDocumentCommand,
  ): Promise<StockDocumentError | undefined> {
    return this.unitOfWork.run<StockDocumentError | undefined>(async () => {
      const document = await this.stockDocumentRepository.findById(
        command.documentId,
      );
      if (!document) {
        return StockDocumentErrors.notFound(command.documentId);
      }

      if (document.status === "POSTED") {
        return StockDocumentErrors.alreadyPosted(command.documentId);
      }

      if (document.status === "CANCELLED") {
        return StockDocumentErrors.alreadyCancelled(command.documentId);
      }

      const movements = await this.stockMovementRepository.findByDocumentId(
        document.id,
      );
      if (movements.length === 0) {
        return StockDocumentErrors.hasNoLines(document.id);
      }

      // Validate OUT movements have sufficient balance
      for (const movement of movements.filter((m) => m.direction === "OUT")) {
        const balance =
          await this.stockBalanceRepository.findByWarehouseAndProduct(
            movement.warehouseId,
            movement.productId,
          );
        const available = balance ? parseFloat(balance.quantity) : 0;
        const requested = parseFloat(movement.baseQuantity);
        if (requested > available) {
          return StockDocumentErrors.insufficientStock({
            productId: movement.productId,
            warehouseId: movement.warehouseId,
            requested: movement.baseQuantity,
            available: balance?.quantity ?? "0",
          });
        }
      }

      // Apply movements to balances
      for (const movement of movements) {
        const existing =
          await this.stockBalanceRepository.findByWarehouseAndProduct(
            movement.warehouseId,
            movement.productId,
          );

        const currentQty = existing ? parseFloat(existing.quantity) : 0;
        const currentCost = existing ? parseFloat(existing.averageCost) : 0;
        const delta = parseFloat(movement.baseQuantity);
        const movementPrice =
          parseFloat(movement.unitPrice) * parseFloat(movement.exchangeRate);

        let newQty: number;
        let newCost: number;

        if (movement.direction === "IN") {
          // Weighted average cost calculation
          const totalCurrentValue = currentQty * currentCost;
          const incomingValue = delta * movementPrice;
          newQty = currentQty + delta;
          newCost =
            newQty > 0 ? (totalCurrentValue + incomingValue) / newQty : 0;
        } else {
          newQty = currentQty - delta;
          newCost = currentCost; // cost stays unchanged on OUT
        }

        const balance = new StockBalanceEntity({
          id: existing?.id ?? crypto.randomUUID(),
          companyId: movement.companyId,
          warehouseId: movement.warehouseId,
          productId: movement.productId,
          quantity: newQty.toFixed(4),
          averageCost: newCost.toFixed(4),
          lastMovementId: movement.id,
          updatedAt: new Date(),
        });

        await this.stockBalanceRepository.saveOrUpdate(balance);
      }

      document.post();
      await this.stockDocumentRepository.update(document);

      await this.eventPublisher.publish({
        aggregateType: "StockDocument",
        aggregateId: document.id,
        eventType: "stock.document.posted",
        payload: {
          documentId: document.id,
          documentType: document.documentType,
          companyId: document.companyId,
          occurredAt: new Date().toISOString(),
        },
      });

      return undefined;
    });
  }
}
