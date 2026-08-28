import { z } from "zod";

const databaseEnvironmentSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
      "DATABASE_URL must be a PostgreSQL connection string",
    ),
});

const authEnvironmentSchema = z.object({
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must contain at least 32 characters"),
});

export function hasDatabaseConfiguration() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDatabaseEnvironment() {
  return databaseEnvironmentSchema.parse(process.env);
}

export function getAuthEnvironment() {
  return authEnvironmentSchema.parse(process.env);
}
