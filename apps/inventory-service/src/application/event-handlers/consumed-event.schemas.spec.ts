import { ZodError } from "zod";
import { parseConsumedEventPayload } from "./consumed-event.schemas";

describe("consumed event schemas", () => {
  it("accepts a valid company.created contract", () => {
    expect(
      parseConsumedEventPayload("company.created", {
        id: crypto.randomUUID(),
        name: "Company",
        baseCurrencyCode: "TRY",
        isActive: true,
        occurredAt: "2026-07-12T00:00:00.000Z",
      }),
    ).toMatchObject({ name: "Company", baseCurrencyCode: "TRY" });
  });

  it("rejects a permanently malformed event", () => {
    expect(() =>
      parseConsumedEventPayload("currency.created", {
        id: "not-a-uuid",
        code: "TOO-LONG",
      }),
    ).toThrow(ZodError);
  });

  it("derives passive status from a deactivated topic", () => {
    expect(
      parseConsumedEventPayload("company.deactivated", {
        id: crypto.randomUUID(),
        isActive: true,
        occurredAt: "2026-07-12T00:00:00.000Z",
      }),
    ).toMatchObject({ isActive: false });
  });
});
