import type { IProductReferenceRepository } from "../../domain/repositories/product-reference.repository.interface";
import type { ConsumedEvent, IConsumedEventHandler } from "./consumed-event";

/* inventory-service'in product.created ve product.updated event'leri aynı
 * snapshot sözleşmesini taşır; ikisi de aynı upsert ile işlenir. */
export class ProductCreatedHandler implements IConsumedEventHandler {
  constructor(private readonly repository: IProductReferenceRepository) {}

  async handle(event: ConsumedEvent): Promise<void> {
    const payload = event.payload as {
      id: string;
      companyId: string;
      sku: string;
      barcode: string | null;
      name: string;
      isActive: boolean;
      occurredAt: Date;
    };
    await this.repository.upsert({
      id: payload.id,
      companyId: payload.companyId,
      sku: payload.sku,
      barcode: payload.barcode ?? null,
      name: payload.name,
      isActive: payload.isActive,
      syncedAt: payload.occurredAt,
    });
  }
}
