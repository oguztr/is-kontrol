import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import {
  COMPANY_ID,
  activityRepositoryFixture,
  actorFixture,
  eventPublisherFixture,
  partnerRepositoryFixture,
  unitOfWorkFixture,
} from "../../../testing/partner.fixtures";
import { CreatePartnerCommand } from "./create-partner.command";
import { CreatePartnerHandler } from "./create-partner.handler";

describe("CreatePartnerHandler", () => {
  function createHandler(companyActive = true) {
    const partners = partnerRepositoryFixture(new Map());
    const activities = activityRepositoryFixture();
    const publisher = eventPublisherFixture();
    const companyReferences: ICompanyReferenceRepository = {
      findById: jest.fn().mockResolvedValue({
        id: COMPANY_ID,
        name: "Company",
        baseCurrencyCode: "TRY",
        isActive: companyActive,
        syncedAt: new Date(),
      }),
      upsert: jest.fn(),
      setActive: jest.fn(),
    };
    const handler = new CreatePartnerHandler(
      partners, activities, companyReferences, publisher,
      unitOfWorkFixture(), actorFixture(),
    );
    return { handler, partners, activities, publisher };
  }

  it("starts a customer-facing partner in the LEAD funnel stage", async () => {
    const { handler, partners, publisher } = createHandler();

    const result = await handler.execute(new CreatePartnerCommand(
      COMPANY_ID, "Acme", "CUSTOMER", "CORPORATE", null, [], null));

    expect(result.isSuccess).toBe(true);
    expect(partners.save).toHaveBeenCalledWith(
      expect.objectContaining({ salesFunnelStage: "LEAD", status: "ACTIVE" }),
    );
    expect(publisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "partner.created",
        payload: expect.objectContaining({ type: "CUSTOMER", isActive: true }),
      }),
    );
  });

  it("keeps the funnel stage empty for a pure supplier", async () => {
    const { handler, partners } = createHandler();

    await handler.execute(new CreatePartnerCommand(
      COMPANY_ID, "Steel Co", "SUPPLIER", "CORPORATE", null, [], null));

    expect(partners.save).toHaveBeenCalledWith(
      expect.objectContaining({ salesFunnelStage: null }),
    );
  });

  it("rejects creation under an inactive company", async () => {
    const { handler, partners } = createHandler(false);

    const result = await handler.execute(new CreatePartnerCommand(
      COMPANY_ID, "Acme", "CUSTOMER", "CORPORATE", null, [], null));

    expect(result.isFailure).toBe(true);
    expect(result.match<unknown>((v) => v, (e) => e)).toMatchObject({ code: "COMPANY_INACTIVE" });
    expect(partners.save).not.toHaveBeenCalled();
  });
});
