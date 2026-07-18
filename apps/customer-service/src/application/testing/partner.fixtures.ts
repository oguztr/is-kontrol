import { PartnerEntity } from "../../domain/entities/partner.entity";
import type { PartnerType } from "../../domain/entities/partner.entity";
import type { IPartnerRepository } from "../../domain/repositories/partner.repository.interface";
import type { IPartnerActivityRepository } from "../../domain/repositories/partner-activity.repository.interface";
import type { IEventPublisherPort } from "../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../ports/unit-of-work.port";
import type { IActorContextPort } from "../ports/actor-context.port";

export const COMPANY_ID = "00000000-0000-4000-8000-00000000c001";

export function partnerFixture(overrides: {
  id?: string;
  type?: PartnerType;
  kind?: "INDIVIDUAL" | "CORPORATE";
} = {}): PartnerEntity {
  const type = overrides.type ?? "CUSTOMER";
  return new PartnerEntity({
    id: overrides.id ?? "00000000-0000-4000-8000-0000000000p1",
    companyId: COMPANY_ID,
    name: "Acme",
    type,
    kind: overrides.kind ?? "CORPORATE",
    status: "ACTIVE",
    salesFunnelStage: type === "SUPPLIER" ? null : "LEAD",
    assignedUserId: null,
    tags: [],
    mergedIntoId: null,
    createdBy: null,
    createdAt: new Date("2026-07-18T00:00:00Z"),
    deletedAt: null,
  });
}

export function partnerRepositoryFixture(
  partnersById: ReadonlyMap<string, PartnerEntity>,
): jest.Mocked<IPartnerRepository> {
  return {
    findById: jest.fn(async (id: string) => partnersById.get(id) ?? null),
    findByIdForUpdate: jest.fn(async (id: string) => partnersById.get(id) ?? null),
    save: jest.fn(),
    update: jest.fn(),
    list: jest.fn().mockResolvedValue([]),
  };
}

export function activityRepositoryFixture(): jest.Mocked<IPartnerActivityRepository> {
  return {
    save: jest.fn(),
    listByPartner: jest.fn().mockResolvedValue([]),
    reassignPartner: jest.fn(),
  };
}

export function eventPublisherFixture(): jest.Mocked<IEventPublisherPort> {
  return { publish: jest.fn() };
}

export function unitOfWorkFixture(): IUnitOfWorkPort {
  return { run: async <T>(work: () => Promise<T>) => work() };
}

export function actorFixture(userId: string | null = null): IActorContextPort {
  return { allowsCompany: () => true, userId: () => userId };
}
