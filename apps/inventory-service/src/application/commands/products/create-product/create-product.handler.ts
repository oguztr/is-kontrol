import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IProductUnitRepository } from "../../../../domain/repositories/product-unit.repository.interface";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { ICurrencyReferenceRepository } from "../../../../domain/repositories/currency-reference.repository.interface";
import type { IProductDependencyRepository } from "../../../../domain/repositories/product-dependency.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { ProductError } from "../../../../domain/errors/product.errors";
import { ProductErrors } from "../../../../domain/errors/product.errors";
import { ProductEntity } from "../../../../domain/entities/product.entity";
import { ProductUnitEntity } from "../../../../domain/entities/product-unit.entity";
import { Decimal } from "../../../../domain/value-objects/decimal.vo";
import { CreateProductCommand } from "./create-product.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class CreateProductHandler {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly productUnitRepository: IProductUnitRepository,
    private readonly companyReferenceRepository: ICompanyReferenceRepository,
    private readonly currencyReferenceRepository: ICurrencyReferenceRepository,
    private readonly productDependencyRepository: IProductDependencyRepository,
    private readonly eventPublisher: IEventPublisherPort,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: CreateProductCommand,
  ): Promise<Result<{ id: string }, ProductError>> {
    // Ürün insert'i ile outbox kaydı aynı transaction'da atılır (transactional outbox).
    const outcome = await this.unitOfWork.run<{ id: string } | ProductError>(
      async () => {
        // Şirket izolasyonu: aktör yalnızca kendi şirketi adına kayıt açabilir.
        if (!this.actor.allowsCompany(command.companyId)) {
          return ProductErrors.companyNotFound(command.companyId);
        }
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

        if (command.categoryId) {
          await this.productDependencyRepository.lockCategoryGraphShared(
            command.companyId,
          );
          if (
            !(await this.productDependencyRepository.categoryBelongsToCompany(
              command.categoryId,
              command.companyId,
            ))
          ) {
            return ProductErrors.categoryNotFound(command.categoryId);
          }
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
        await this.productRepository.lockCompanyProducts(command.companyId);
        if (command.barcode) {
          const barcodeOwner = await this.productRepository.findByBarcode(
            command.companyId,
            command.barcode,
          );
          if (barcodeOwner) {
            return ProductErrors.barcodeAlreadyExists(
              command.companyId,
              command.barcode,
            );
          }
        }

        const product = new ProductEntity({
          id: crypto.randomUUID(),
          companyId: command.companyId,
          sku: command.sku,
          barcode: command.barcode,
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

        // Ana birim, ürün birimleri listesinde her zaman 1 katsayısıyla yer alır.
        await this.productUnitRepository.save(
          new ProductUnitEntity(
            crypto.randomUUID(),
            product.id,
            product.baseUnitId,
            "1.000000",
            true,
            true,
            null,
            new Date(),
          ),
        );

        await this.eventPublisher.publish({
          aggregateType: "Product",
          aggregateId: product.id,
          eventType: "product.created",
          payload: {
            id: product.id,
            companyId: product.companyId,
            sku: product.sku,
            barcode: product.barcode,
            name: product.name,
            baseUnitId: product.baseUnitId,
            isActive: product.isActive,
            occurredAt: new Date().toISOString(),
          },
        });

        return { id: product.id };
      },
    );
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }
}
