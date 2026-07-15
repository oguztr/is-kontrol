import type { ProductEntity } from "../../../domain/entities/product.entity";
import { ProductErrors } from "../../../domain/errors/product.errors";
import type { ProductError } from "../../../domain/errors/product.errors";
import type { IProductDependencyRepository } from "../../../domain/repositories/product-dependency.repository.interface";
import type { IProductRepository } from "../../../domain/repositories/product.repository.interface";
import type { IEventPublisherPort } from "../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../ports/actor-context.port";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

/* Ürünü kilitleyip değiştiren ve domain event'ini outbox'a yazan command
 * handler'ların ortak gövdesi. Başka şirketin ürünü, yokmuş gibi reddedilir
 * (veri izolasyonu); arşivli ürün yalnız silinebilir. */
export abstract class ProductCommandHandlerBase {
  protected constructor(
    protected readonly products: IProductRepository,
    protected readonly dependencies: IProductDependencyRepository,
    protected readonly publisher: IEventPublisherPort,
    protected readonly unitOfWork: IUnitOfWorkPort,
    protected readonly actor: IActorContextPort,
  ) {}

  protected async mutate(
    id: string,
    eventType: string,
    change: (
      product: ProductEntity,
    ) => Promise<ProductError | undefined> | ProductError | undefined | void,
    lockCategoryGraph = false,
  ): Promise<Result<void, ProductError>> {
    const error = await this.unitOfWork.run<ProductError | undefined>(
      async () => {
        if (lockCategoryGraph) {
          const snapshot = await this.products.findById(id);
          if (!snapshot) return ProductErrors.notFound(id);
          await this.dependencies.lockCategoryGraphShared(snapshot.companyId);
        }
        const product = await this.products.findByIdForUpdate(id);
        if (!product) return ProductErrors.notFound(id);
        if (!this.actor.allowsCompany(product.companyId))
          return ProductErrors.notFound(id);
        if (product.archivedAt && eventType !== "product.deleted")
          return ProductErrors.archived(id);
        const changeError = await change(product);
        if (changeError) return changeError;
        await this.products.update(product);
        await this.publisher.publish({
          aggregateType: "Product",
          aggregateId: product.id,
          eventType,
          payload: {
            id: product.id,
            companyId: product.companyId,
            occurredAt: new Date().toISOString(),
          },
        });
        return undefined;
      },
    );
    return error ? new Failure(error) : new Success(undefined);
  }
}
