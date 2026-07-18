import {
  activityRepositoryFixture,
  actorFixture,
  eventPublisherFixture,
  partnerFixture,
  partnerRepositoryFixture,
  unitOfWorkFixture,
} from "../../../testing/partner.fixtures";
import { UpdateSalesFunnelStageCommand } from "./update-sales-funnel-stage.command";
import { UpdateSalesFunnelStageHandler } from "./update-sales-funnel-stage.handler";

describe("UpdateSalesFunnelStageHandler", () => {
  function createHandler(partner = partnerFixture()) {
    const partners = partnerRepositoryFixture(new Map([[partner.id, partner]]));
    const activities = activityRepositoryFixture();
    const handler = new UpdateSalesFunnelStageHandler(
      partners, activities, eventPublisherFixture(),
      unitOfWorkFixture(), actorFixture(),
    );
    return { handler, partner, partners, activities };
  }

  it("moves a customer through the funnel and records the change", async () => {
    const { handler, partner, activities } = createHandler();

    const result = await handler.execute(
      new UpdateSalesFunnelStageCommand(partner.id, "PROSPECT"),
    );

    expect(result.isSuccess).toBe(true);
    expect(partner.salesFunnelStage).toBe("PROSPECT");
    expect(activities.save).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "STAGE_CHANGED" }),
    );
  });

  it("rejects the funnel for a pure supplier", async () => {
    const { handler, partner, partners } = createHandler(
      partnerFixture({ type: "SUPPLIER" }),
    );

    const result = await handler.execute(
      new UpdateSalesFunnelStageCommand(partner.id, "LEAD"),
    );

    expect(result.isFailure).toBe(true);
    expect(result.match<unknown>((v) => v, (e) => e)).toMatchObject({
      code: "SALES_FUNNEL_NOT_APPLICABLE",
    });
    expect(partners.update).not.toHaveBeenCalled();
  });
});
