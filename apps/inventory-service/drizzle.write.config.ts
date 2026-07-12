import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL_PRIMARY;
if (!databaseUrl) {
  throw new Error("DATABASE_URL_PRIMARY is required");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/infrastructure/persistence/drizzle/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
