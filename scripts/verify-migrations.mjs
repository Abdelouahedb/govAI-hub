import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import pg from "pg";

// Never fall back to the application's DATABASE_URL for an integration test.
const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("Set TEST_DATABASE_URL to a dedicated empty PostgreSQL database.");
const url = new URL(connectionString);
if (url.hostname.includes("-pooler.")) throw new Error("TEST_DATABASE_URL must use a direct connection.");
const client = new pg.Client({ connectionString, connectionTimeoutMillis: 10_000 });
try {
  await client.connect();
  const objects = await client.query(`
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND n.nspname NOT LIKE 'pg_toast%' AND n.nspname NOT LIKE 'pg_temp%'
    UNION ALL
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typtype = 'e' AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    LIMIT 1
  `);
  if (objects.rowCount) throw new Error("Refusing migration test: the database is not empty.");
} finally {
  await client.end();
}
const require = createRequire(import.meta.url);
const prisma = require.resolve("prisma/build/index.js");
const env = { ...process.env, DATABASE_URL: connectionString, DATABASE_URL_UNPOOLED: connectionString };
for (const args of [
  ["migrate", "deploy"],
  ["migrate", "deploy"], // A second deployment must leave the schema unchanged.
  ["migrate", "status"],
  ["migrate", "diff", "--from-config-datasource", "--to-schema", "prisma/schema.prisma", "--exit-code"],
]) {
  const result = spawnSync(process.execPath, [prisma, ...args], {
    cwd: fileURLToPath(new URL("..", import.meta.url)), env, stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log("Fresh migration replay, repeat deployment and schema comparison passed.");
