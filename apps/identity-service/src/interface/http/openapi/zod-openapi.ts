import { applyDecorators } from "@nestjs/common";
import { ApiBody, ApiQuery } from "@nestjs/swagger";
import { z } from "zod";
import type { ZodType } from "zod";

/* @nestjs/swagger, SchemaObject tipini paket kökünden dışa açmadığı için
 * yapısal karşılığı burada tanımlanır; ApiBody/ApiQuery'ye geçirilirken
 * tek noktadan daraltılır. */
export interface OpenApiSchema {
  type?: string;
  properties?: Record<string, OpenApiSchema>;
  required?: string[];
  [key: string]: unknown;
}

/* DTO'lar class-validator sınıfları değil zod şemaları olduğu için OpenAPI
 * şemaları zod'un yerleşik JSON Schema dönüşümüyle üretilir. io: "input",
 * transform'lu alanlarda (ör. datetime → Date) istemcinin GÖNDERECEĞİ biçimi
 * belgeler. */
export function zodToOpenApi(schema: ZodType): OpenApiSchema {
  const jsonSchema = z.toJSONSchema(schema, {
    io: "input",
    target: "openapi-3.0",
    unrepresentable: "any",
  }) as OpenApiSchema;
  delete jsonSchema["$schema"];
  delete jsonSchema["id"];
  return jsonSchema;
}

/** Request body'yi zod şemasından belgeler: `@ZodBody(signUpSchema)` */
export function ZodBody(schema: ZodType): MethodDecorator {
  return ApiBody({ schema: zodToOpenApi(schema) as never });
}

/** Query nesnesinin her alanını ayrı query parametresi olarak belgeler. */
export function ZodQueries(schema: ZodType): MethodDecorator {
  const jsonSchema = zodToOpenApi(schema);
  const decorators = Object.entries(jsonSchema.properties ?? {}).map(
    ([name, propertySchema]) =>
      ApiQuery({
        name,
        required: jsonSchema.required?.includes(name) ?? false,
        schema: propertySchema as never,
      }),
  );
  return applyDecorators(...decorators);
}
