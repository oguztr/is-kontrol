import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { ICurrencyReferenceRepository } from "../../../../domain/repositories/currency-reference.repository.interface";
import type { IProductDependencyRepository } from "../../../../domain/repositories/product-dependency.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { ProductError } from "../../../../domain/errors/product.errors";
import { ProductErrors } from "../../../../domain/errors/product.errors";
import { ProductEntity } from "../../../../domain/entities/product.entity";
import { Decimal } from "../../../../domain/value-objects/decimal.vo";
import { CreateProductCommand } from "./create-product.command";
import { Failure, Result, Success } from "../../../result";

export class CreateProductHandler {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly companyReferenceRepository: ICompanyReferenceRepository,
    private readonly currencyReferenceRepository: ICurrencyReferenceRepository,
    private readonly productDependencyRepository: IProductDependencyRepository,
    private readonly eventPublisher: IEventPublisherPort,
    private readonly unitOfWork: IUnitOfWorkPort,
  ) {}

  async execute(
    command: CreateProductCommand,
  ): Promise<Result<{ id: string }, ProductError>> {
    // Ürün insert'i ile outbox kaydı aynı transaction'da atılır (transactional outbox).
    const outcome = await this.unitOfWork.run<{ id: string } | ProductError>(async () => {
      // Reference (cache) tablolara hard FK yok; bütünlük burada doğrulanır.
      const company = await this.companyReferenceRepository.findById(
        command.companyId,
      );
      if (!company) {
        return ProductErrors.companyNotFound(command.companyId);
      }
      if (!company.isActive) {
        return ProductErrors.companyInactive(command.companyId);
      }

      if (
        !(await this.productDependencyRepository.unitBelongsToCompany(
          command.baseUnitId,
          command.companyId,
        ))
      ) {
        return ProductErrors.baseUnitNotFound(command.baseUnitId);
      }

      if (
        command.categoryId &&
        !(await this.productDependencyRepository.categoryBelongsToCompany(
          command.categoryId,
          command.companyId,
        ))
      ) {
        return ProductErrors.categoryNotFound(command.categoryId);
      }

      if (command.defaultCurrencyId) {
        const currency = await this.currencyReferenceRepository.findById(
          command.defaultCurrencyId,
        );
        if (!currency || !currency.isActive) {
          return ProductErrors.currencyNotFound(command.defaultCurrencyId);
        }
      }

      if (
        command.maxStockLevel &&
        Decimal.from(command.minStockLevel).isGreaterThan(
          Decimal.from(command.maxStockLevel),
        )
      ) {
        return ProductErrors.invalidStockLevelRange(
          command.minStockLevel,
          command.maxStockLevel,
        );
      }

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

      const inserted = await this.productRepository.save(product);
      if (!inserted) {
        return ProductErrors.skuAlreadyExists(command.companyId, command.sku);
      }

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
    });
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }
}
