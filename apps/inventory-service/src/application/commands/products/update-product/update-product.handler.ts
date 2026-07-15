import { Decimal } from "../../../../domain/value-objects/decimal.vo";
import { ProductErrors } from "../../../../domain/errors/product.errors";
import type { ProductError } from "../../../../domain/errors/product.errors";
import type { ICurrencyReferenceRepository } from "../../../../domain/repositories/currency-reference.repository.interface";
import type { IProductDependencyRepository } from "../../../../domain/repositories/product-dependency.repository.interface";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { ProductCommandHandlerBase } from "../product-command.base";
import { UpdateProductCommand } from "./update-product.command";
import { Result } from "@is-kontrol/shared-result";

export class UpdateProductHandler extends ProductCommandHandlerBase {
  constructor(
    products: IProductRepository,
    dependencies: IProductDependencyRepository,
    private readonly currencies: ICurrencyReferenceRepository,
    publisher: IEventPublisherPort,
    unitOfWork: IUnitOfWorkPort,
    actor: IActorContextPort,
  ) {
    super(products, dependencies, publisher, unitOfWork, actor);
  }

  async execute(
    command: UpdateProductCommand,
  ): Promise<Result<void, ProductError>> {
    return this.mutate(
      command.id,
      "product.updated",
      async (product) => {
        await this.products.lockCompanyProducts(product.companyId);
        if (command.barcode) {
          const owner = await this.products.findByBarcode(
            product.companyId,
            command.barcode,
          );
          if (owner && owner.id !== product.id) {
            return ProductErrors.barcodeAlreadyExists(
              product.companyId,
              command.barcode,
            );
          }
        }
        if (
          command.categoryId &&
          !(await this.dependencies.categoryBelongsToCompany(
            command.categoryId,
            product.companyId,
          ))
        ) {
          return ProductErrors.categoryNotFound(command.categoryId);
        }
        if (command.defaultCurrencyId) {
          const currency = await this.currencies.findById(
            command.defaultCurrencyId,
          );
          if (!currency || !currency.isActive)
            return ProductErrors.currencyNotFound(command.defaultCurrencyId);
        }
        product.update(
          command.name ?? product.name,
          command.description === undefined
            ? product.description
            : command.description,
          command.barcode === undefined ? product.barcode : command.barcode,
          command.categoryId === undefined
            ? product.categoryId
            : command.categoryId,
          command.defaultCurrencyId === undefined
            ? product.defaultCurrencyId
            : command.defaultCurrencyId,
        );
        const minimum = command.minStockLevel ?? product.minStockLevel;
        const maximum =
          command.maxStockLevel === undefined
            ? product.maxStockLevel
            : command.maxStockLevel;
        if (
          maximum &&
          Decimal.from(minimum).isGreaterThan(Decimal.from(maximum))
        ) {
          return ProductErrors.invalidStockLevelRange(minimum, maximum);
        }
        product.setStockLevels(minimum, maximum);
        return undefined;
      },
      command.categoryId !== undefined,
    );
  }
}
