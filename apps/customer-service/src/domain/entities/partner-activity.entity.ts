export type PartnerActivityKind =
  | "PARTNER_CREATED"
  | "PARTNER_UPDATED"
  | "STATUS_CHANGED"
  | "TYPE_EXPANDED"
  | "STAGE_CHANGED"
  | "REPRESENTATIVE_ASSIGNED"
  | "PARTNER_MERGED"
  | "PARTNER_DELETED";

/* Notlarla birlikte aktivite zaman çizelgesini besleyen değişiklik kaydı.
 * detail alanı olaya özgü önce/sonra değerlerini taşır (audit izi). */
export class PartnerActivityEntity {
  public readonly id: string;
  public partnerId: string;
  public readonly kind: PartnerActivityKind;
  public readonly detail: Record<string, unknown>;
  public readonly actorUserId: string | null;
  public readonly createdAt: Date;

  constructor(params: {
    id: string;
    partnerId: string;
    kind: PartnerActivityKind;
    detail: Record<string, unknown>;
    actorUserId: string | null;
    createdAt: Date;
  }) {
    this.id = params.id;
    this.partnerId = params.partnerId;
    this.kind = params.kind;
    this.detail = params.detail;
    this.actorUserId = params.actorUserId;
    this.createdAt = params.createdAt;
  }
}
