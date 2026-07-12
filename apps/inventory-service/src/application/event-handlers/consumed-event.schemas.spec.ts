import { ZodError } from "zod";
import { parseConsumedEventPayload } from "./consumed-event.schemas";

describe("consumed event schemas", () => {
  it("accepts a valid company.created contract", () => {
    expect(
      parseConsumedEventPayload("company.created", {
        id: crypto.randomUUID(),
        name: "Company",
        baseCurrencyCode: "TRY",
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
});
