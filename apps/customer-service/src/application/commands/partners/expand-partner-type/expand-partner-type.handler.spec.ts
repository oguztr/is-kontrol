import {
  activityRepositoryFixture,
  actorFixture,
  eventPublisherFixture,
  partnerFixture,
  partnerRepositoryFixture,
  unitOfWorkFixture,
} from "../../../testing/partner.fixtures";
import { ExpandPartnerTypeCommand } from "./expand-partner-type.command";
import { ExpandPartnerTypeHandler } from "./expand-partner-type.handler";

describe("ExpandPartnerTypeHandler", () => {
  function createHandler(partner = partnerFixture()) {
    const partners = partnerRepositoryFixture(new Map([[partner.id, partner]]));
    const publisher = eventPublisherFixture();
    const handler = new ExpandPartnerTypeHandler(
      partners, activityRepositoryFixture(), publisher,
      unitOfWorkFixture(), actorFixture(),
    );
    return { handler, partner, partners, publisher };
  }

  it("expands a supplier to BOTH and enters the sales funnel", async () => {
    const { handler, partner, publisher } = createHandler(
      partnerFixture({ type: "SUPPLIER" }),
    );

    const result = await handler.execute(new ExpandPartnerTypeCommand(partner.id, "BOTH"));

    expect(result.isSuccess).toBe(true);
    expect(partner.type).toBe("BOTH");
    expect(partner.salesFunnelStage).toBe("LEAD");
    expect(publisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "partner.type-changed" }),
    );
  });

  it("rejects narrowing BOTH back to CUSTOMER", async () => {
    const { handler, partner } = createHandler(partnerFixture({ type: "BOTH" }));

    const result = await handler.execute(new ExpandPartnerTypeCommand(partner.id, "CUSTOMER"));

    expect(result.isFailure).toBe(true);
    expect(result.match<unknown>((v) => v, (e) => e)).toMatchObject({
      code: "PARTNER_TYPE_NARROWING_NOT_ALLOWED",
    });
  });
});
