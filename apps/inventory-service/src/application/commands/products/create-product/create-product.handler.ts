import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { ProductError } from "../../../../domain/errors/product.errors";
import { ProductErrors } from "../../../../domain/errors/product.errors";
import { ProductEntity } from "../../../../domain/entities/product.entity";
import { CreateProductCommand } from "./create-product.command";

export class CreateProductHandler {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly eventPublisher: IEventPublisherPort,
  ) {}

  async execute(
    command: CreateProductCommand,
  ): Promise<{ id: string } | ProductError> {
    const existing = await this.productRepository.findBySku(
      command.companyId,
      command.sku,
    );
    if (existing) {
      return ProductErrors.skuAlreadyExists(command.companyId, command.sku);
    }

    const product = new ProductEntity({
      id: crypto.randomUUID(),
      companyId: command.companyId,
      sku: command.sku,
      name: command.name,
      description: command.description,
      baseUnitId: command.baseUnitId,
      categoryId: command.categoryId,
      defaultCurrencyId: command.defaultCurrencyId,
      minStockLevel: command.minStockLevel,
      maxStockLevel: command.maxStockLevel,
      isActive: true,
      createdAt: new Date(),
    });

    await this.productRepository.save(product);

    await this.eventPublisher.publish({
      aggregateType: "Product",
      aggregateId: product.id,
      eventType: "product.created",
      payload: {
        id: product.id,
        companyId: product.companyId,
        sku: product.sku,
        name: product.name,
        baseUnitId: product.baseUnitId,
        occurredAt: new Date().toISOString(),
      },
    });

    return { id: product.id };
  }
}
