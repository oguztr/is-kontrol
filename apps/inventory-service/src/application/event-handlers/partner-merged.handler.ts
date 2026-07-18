import type { IBusinessPartnerReferenceRepository } from "../../domain/repositories/business-partner-reference.repository.interface";
import type { ConsumedEvent, IConsumedEventHandler } from "./consumed-event";

/* Mükerrer birleştirmede kaybeden partner referansı pasifleştirilir; yeni
 * belgeler survivor id ile açılır, eski belgelerdeki id tarihsel kayıt olarak
 * kalır. (Hayatta kalanın güncel hali ayrıca partner.updated ile gelir.) */
export class PartnerMergedHandler implements IConsumedEventHandler {
  constructor(private readonly repository: IBusinessPartnerReferenceRepository) {}

  async handle(event: ConsumedEvent): Promise<void> {
    const payload = event.payload as {
      mergedPartnerId: string;
      occurredAt: Date;
    };
    await this.repository.setActive(payload.mergedPartnerId, false, payload.occurredAt);
  }
}
