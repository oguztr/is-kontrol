function primaryDatabaseUrl(): string {
  const configured = process.env.DATABASE_URL_PRIMARY;
  if (configured) return configured;
  if (process.env.NODE_ENV === "test") {
    return "postgresql://test:test@localhost:5432/customer_test";
  }
  throw new Error("DATABASE_URL_PRIMARY is required");
}

const primaryUrl = primaryDatabaseUrl();

export const databaseConfig = {
  primaryUrl,
  replicaUrl: process.env.DATABASE_URL_REPLICA ?? primaryUrl,
} as const;
