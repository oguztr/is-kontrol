import type { IProductReferenceRepository } from "../../domain/repositories/product-reference.repository.interface";
import type { ConsumedEvent, IConsumedEventHandler } from "./consumed-event";

/* activated/deactivated/archived/deleted geçişleri cache'te yalnızca aktiflik
 * bayrağını günceller; kayıt tarihsel referans olarak silinmeden kalır. */
export class ProductStatusChangedHandler implements IConsumedEventHandler {
  constructor(private readonly repository: IProductReferenceRepository) {}

  async handle(event: ConsumedEvent): Promise<void> {
    const payload = event.payload as { id: string; isActive: boolean; occurredAt: Date };
    await this.repository.setActive(payload.id, payload.isActive, payload.occurredAt);
  }
}
