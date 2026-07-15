import { z } from "zod";
import { zodToOpenApi } from "./zod-openapi";

describe("zodToOpenApi", () => {
  it("converts a zod object to an OpenAPI schema with required list", () => {
    const schema = zodToOpenApi(
      z.object({
        companyId: z.string().uuid(),
        name: z.string().min(1).optional(),
      }),
    ) as { type: string; properties: Record<string, { type: string }>; required?: string[] };
    expect(schema.type).toBe("object");
    expect(schema.properties.companyId.type).toBe("string");
    expect(schema.required).toEqual(["companyId"]);
    expect(schema).not.toHaveProperty("$schema");
  });

  it("documents the input side of transform pipelines", () => {
    const schema = zodToOpenApi(
      z.object({
        documentDate: z
          .string()
          .datetime({ offset: true })
          .transform((value) => new Date(value)),
      }),
    ) as { properties: Record<string, { type: string; format?: string }> };
    expect(schema.properties.documentDate.type).toBe("string");
    expect(schema.properties.documentDate.format).toBe("date-time");
  });
});
