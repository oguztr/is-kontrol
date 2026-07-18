import type { PartnerActivityEntity } from "../entities/partner-activity.entity";

export interface IPartnerActivityRepository {
  save(activity: PartnerActivityEntity): Promise<void>;
  listByPartner(partnerId: string): Promise<PartnerActivityEntity[]>;
  reassignPartner(fromPartnerId: string, toPartnerId: string): Promise<void>;
}
