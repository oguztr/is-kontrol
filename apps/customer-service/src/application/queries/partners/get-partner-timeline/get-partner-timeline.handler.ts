import type { NoteType } from "../../../../domain/entities/note.entity";
import type { PartnerActivityKind } from "../../../../domain/entities/partner-activity.entity";
import { PartnerErrors } from "../../../../domain/errors/partner.errors";
import type { PartnerError } from "../../../../domain/errors/partner.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { IPartnerActivityRepository } from "../../../../domain/repositories/partner-activity.repository.interface";
import type { INoteRepository } from "../../../../domain/repositories/note.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { GetPartnerTimelineQuery } from "./get-partner-timeline.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

/** Not + durum değişikliği birleşik kronolojisinin tek satırı. */
export type TimelineItem =
  | {
      itemType: "NOTE";
      id: string;
      noteType: NoteType;
      content: string;
      pinned: boolean;
      authorUserId: string | null;
      occurredAt: Date;
    }
  | {
      itemType: "ACTIVITY";
      id: string;
      kind: PartnerActivityKind;
      detail: Record<string, unknown>;
      actorUserId: string | null;
      occurredAt: Date;
    };

/* Aktivite zaman çizelgesi: notlar ve durum/tip/aşama değişiklikleri tek
 * kronolojide (yeniden eskiye) birleştirilir. */
export class GetPartnerTimelineHandler {
  constructor(
    private readonly partners: IPartnerRepository,
    private readonly activities: IPartnerActivityRepository,
    private readonly notes: INoteRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetPartnerTimelineQuery,
  ): Promise<Result<TimelineItem[], PartnerError>> {
    const partner = await this.partners.findById(query.partnerId);
    if (!partner || !this.actor.allowsCompany(partner.companyId)) {
      return new Failure(PartnerErrors.notFound(query.partnerId));
    }
    const [activities, notes] = await Promise.all([
      this.activities.listByPartner(partner.id),
      this.notes.listByPartner(partner.id),
    ]);
    const items: TimelineItem[] = [
      ...notes.map<TimelineItem>((note) => ({
        itemType: "NOTE",
        id: note.id,
        noteType: note.type,
        content: note.content,
        pinned: note.pinned,
        authorUserId: note.authorUserId,
        occurredAt: note.createdAt,
      })),
      ...activities.map<TimelineItem>((activity) => ({
        itemType: "ACTIVITY",
        id: activity.id,
        kind: activity.kind,
        detail: activity.detail,
        actorUserId: activity.actorUserId,
        occurredAt: activity.createdAt,
      })),
    ];
    items.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
    return new Success(items);
  }
}
