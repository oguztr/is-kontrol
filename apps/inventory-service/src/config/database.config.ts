export const databaseConfig = {
  primaryUrl: process.env.DATABASE_URL_PRIMARY ?? '',
  replicaUrl: process.env.DATABASE_URL_REPLICA ?? process.env.DATABASE_URL_PRIMARY ?? '',
} as const;
