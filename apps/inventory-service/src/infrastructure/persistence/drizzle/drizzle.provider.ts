import { drizzle } from "drizzle-orm/postgres-js";

export const writeDb = drizzle(process.env.DATABASE_URL_PRIMARY ?? "");
export const readDb = drizzle(
  process.env.DATABASE_URL_REPLICA ?? process.env.DATABASE_URL_PRIMARY ?? "",
);

export type WriteDb = typeof writeDb;
export type ReadDb = typeof readDb;
