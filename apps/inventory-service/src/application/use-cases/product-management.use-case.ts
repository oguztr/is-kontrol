import { Decimal } from "../../domain/value-objects/decimal.vo";
import { ProductErrors } from "../../domain/errors/product.errors";
import type { ProductError } from "../../domain/errors/product.errors";
import type { ICompanyReferenceRepository } from "../../domain/repositories/company-reference.repository.interface";
import type { ICurrencyReferenceRepository } from "../../domain/repositories/currency-reference.repository.interface";
import type { IProductDependencyRepository } from "../../domain/repositories/product-dependency.repository.interface";
import type { IProductRepository, ProductListFilter } from "../../domain/repositories/product.repository.interface";
import type { IEventPublisherPort } from "../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../ports/unit-of-work.port";
import { Failure, Result, Success } from "../result";

export interface UpdateProductInput {
  name?: string; description?: string | null; barcode?: string | null;
  categoryId?: string | null; defaultCurrencyId?: string | null;
  minStockLevel?: string; maxStockLevel?: string | null;
}

export class ProductManagementUseCase {
  constructor(
    private readonly products: IProductRepository,
    private readonly dependencies: IProductDependencyRepository,
    private readonly currencies: ICurrencyReferenceRepository,
    private readonly companies: ICompanyReferenceRepository,
    private readonly publisher: IEventPublisherPort,
    private readonly unitOfWork: IUnitOfWorkPort,
  ) {}

  async update(id: string, input: UpdateProductInput): Promise<Result<void, ProductError>> {
    return this.mutate(id, "product.updated", async (product) => {
      await this.products.lockCompanyProducts(product.companyId);
      if (input.barcode) {
        const owner = await this.products.findByBarcode(product.companyId, input.barcode);
        if (owner && owner.id !== product.id) {
          return ProductErrors.barcodeAlreadyExists(product.companyId, input.barcode);
        }
      }
      if (input.categoryId && !(await this.dependencies.categoryBelongsToCompany(input.categoryId, product.companyId))) {
        return ProductErrors.categoryNotFound(input.categoryId);
      }
      if (input.defaultCurrencyId) {
        const currency = await this.currencies.findById(input.defaultCurrencyId);
        if (!currency || !currency.isActive) return ProductErrors.currencyNotFound(input.defaultCurrencyId);
      }
      product.update(
        input.name ?? product.name,
        input.description === undefined ? product.description : input.description,
        input.barcode === undefined ? product.barcode : input.barcode,
        input.categoryId === undefined ? product.categoryId : input.categoryId,
        input.defaultCurrencyId === undefined ? product.defaultCurrencyId : input.defaultCurrencyId,
      );
      const minimum = input.minStockLevel ?? product.minStockLevel;
      const maximum = input.maxStockLevel === undefined ? product.maxStockLevel : input.maxStockLevel;
      if (maximum && Decimal.from(minimum).isGreaterThan(Decimal.from(maximum))) {
        return ProductErrors.invalidStockLevelRange(minimum, maximum);
      }
      product.setStockLevels(minimum, maximum);
      return undefined;
    }, input.categoryId !== undefined);
  }

  async activate(id: string): Promise<Result<void, ProductError>> {
    return this.mutate(id, "product.activated", (product) => {
      if (product.archivedAt) return ProductErrors.archived(id);
      product.activate();
      return undefined;
    });
  }

  async deactivate(id: string): Promise<Result<void, ProductError>> {
    return this.mutate(id, "product.deactivated", (product) => { product.deactivate(); });
  }

  async archive(id: string): Promise<Result<void, ProductError>> {
    return this.mutate(id, "product.archived", (product) => { product.archive(new Date()); });
  }

  async delete(id: string): Promise<Result<void, ProductError>> {
    return this.mutate(id, "product.deleted", async (product) => {
      if (await this.products.hasMovements(id)) return ProductErrors.hasStockMovements(id);
      product.delete(new Date());
      return undefined;
    });
  }

  async changeBaseUnit(id: string, baseUnitId: string): Promise<Result<void, ProductError>> {
    return this.mutate(id, "product.base-unit.changed", async (product) => {
      if (await this.products.hasMovements(id)) return ProductErrors.baseUnitChangeHasMovements(id);
      if (!(await this.dependencies.unitBelongsToCompany(baseUnitId, product.companyId))) {
        return ProductErrors.baseUnitNotFound(baseUnitId);
      }
      product.changeBaseUnit(baseUnitId);
      return undefined;
    });
  }

  async setStockLevels(id: string, minimum: string, maximum: string | null): Promise<Result<void, ProductError>> {
    return this.mutate(id, "product.stock-levels.changed", (product) => {
      if (maximum && Decimal.from(minimum).isGreaterThan(Decimal.from(maximum))) {
        return ProductErrors.invalidStockLevelRange(minimum, maximum);
      }
      product.setStockLevels(minimum, maximum);
      return undefined;
    });
  }

  async list(filter: ProductListFilter): Promise<Result<Awaited<ReturnType<IProductRepository["list"]>>, ProductError>> {
    const company = await this.companies.findById(filter.companyId);
    if (!company) return new Failure(ProductErrors.companyNotFound(filter.companyId));
    if (filter.categoryId && !(await this.dependencies.categoryBelongsToCompany(filter.categoryId, filter.companyId))) {
      return new Failure(ProductErrors.categoryNotFound(filter.categoryId));
    }
    return new Success(await this.products.list(filter));
  }

  async get(id: string): Promise<Result<NonNullable<Awaited<ReturnType<IProductRepository["findById"]>>>, ProductError>> {
    const product = await this.products.findById(id);
    return product ? new Success(product) : new Failure(ProductErrors.notFound(id));
  }

  async bySku(companyId: string, sku: string) { return this.lookup(await this.products.findBySku(companyId, sku), sku); }
  async byBarcode(companyId: string, barcode: string) { return this.lookup(await this.products.findByBarcode(companyId, barcode), barcode); }

  private lookup(product: Awaited<ReturnType<IProductRepository["findById"]>>, key: string) {
    return product ? new Success(product) : new Failure(ProductErrors.notFound(key));
  }

  private async mutate(
    id: string,
    eventType: string,
    change: (product: NonNullable<Awaited<ReturnType<IProductRepository["findById"]>>>) => Promise<ProductError | undefined> | ProductError | undefined | void,
    lockCategoryGraph = false,
  ): Promise<Result<void, ProductError>> {
    const error = await this.unitOfWork.run<ProductError | undefined>(async () => {
      if (lockCategoryGraph) {
        const snapshot = await this.products.findById(id);
        if (!snapshot) return ProductErrors.notFound(id);
        await this.dependencies.lockCategoryGraphShared(snapshot.companyId);
      }
      const product = await this.products.findByIdForUpdate(id);
      if (!product) return ProductErrors.notFound(id);
      if (product.archivedAt && eventType !== "product.deleted") return ProductErrors.archived(id);
      const changeError = await change(product);
      if (changeError) return changeError;
      await this.products.update(product);
      await this.publisher.publish({
        aggregateType: "Product", aggregateId: product.id, eventType,
        payload: { id: product.id, companyId: product.companyId, occurredAt: new Date().toISOString() },
      });
      return undefined;
    });
    return error ? new Failure(error) : new Success(undefined);
  }
}
