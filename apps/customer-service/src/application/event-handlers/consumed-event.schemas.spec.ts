import { ZodError } from "zod";
import { parseConsumedEventPayload } from "./consumed-event.schemas";

describe("consumed event schemas", () => {
  it("accepts a valid product.created contract", () => {
    expect(
      parseConsumedEventPayload("product.created", {
        id: crypto.randomUUID(),
        companyId: crypto.randomUUID(),
        sku: "SKU-001",
        barcode: null,
        name: "Widget",
        isActive: true,
        occurredAt: "2026-07-18T00:00:00.000Z",
      }),
    ).toMatchObject({ sku: "SKU-001", name: "Widget", isActive: true });
  });

  it("rejects a permanently malformed product event", () => {
    expect(() =>
      parseConsumedEventPayload("product.created", {
        id: "not-a-uuid",
        name: "Widget",
      }),
    ).toThrow(ZodError);
  });

  it("derives passive status from a deactivated topic", () => {
    expect(
      parseConsumedEventPayload("product.deactivated", {
        id: crypto.randomUUID(),
        isActive: true,
        occurredAt: "2026-07-18T00:00:00.000Z",
      }),
    ).toMatchObject({ isActive: false });
  });

  it("keeps producer-sent passive flag on archived/deleted topics", () => {
    expect(
      parseConsumedEventPayload("product.archived", {
        id: crypto.randomUUID(),
        isActive: false,
        occurredAt: "2026-07-18T00:00:00.000Z",
      }),
    ).toMatchObject({ isActive: false });
  });
});
