import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import pg from "pg";

config({ path: fileURLToPath(new URL("../.env", import.meta.url)), quiet: true });

const duplicate = "20260810130000_add_incident_management";
const canonical = "20260810161453_add_incident_management";
const previousChecksum = "3e41e18731d06a0544386a7b9f016540aa42037ac47619121950d93993d94712";
const canonicalChecksum = "2a8de7bf59a3812ea5b2198db4e306ab1480800584859882954d9875adfc5283";
const migrationBytes = (name) => readFileSync(new URL(`../prisma/migrations/${name}/migration.sql`, import.meta.url));
const checksum = (name) => createHash("sha256").update(migrationBytes(name)).digest("hex");
const apply = process.argv.includes("--apply");

if (process.argv.slice(2).some((arg) => arg !== "--apply")) {
  throw new Error("Usage: node scripts/repair-incident-migration.mjs [--apply]");
}
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DATABASE_URL_UNPOOLED or DATABASE_URL.");
const target = new URL(connectionString);
if (target.hostname.includes("-pooler.")) {
  throw new Error("Use a direct connection in DATABASE_URL_UNPOOLED for this repair.");
}
if (checksum(canonical) !== canonicalChecksum) {
  throw new Error("The canonical incident migration has changed; review manually.");
}
if (migrationBytes(duplicate).toString("utf8").split(/\r?\n/)
  .some((line) => line.trim() && !line.trim().startsWith("--"))) {
  throw new Error("The duplicate must contain comments only.");
}
const replacementChecksum = checksum(duplicate);
const client = new pg.Client({ connectionString, connectionTimeoutMillis: 10_000 });

try {
  await client.connect();
  await client.query(apply ? "BEGIN" : "BEGIN READ ONLY");
  await client.query("SET LOCAL lock_timeout = '5s'");
  await client.query("SET LOCAL statement_timeout = '15s'");
  console.log(`${apply ? "Repair" : "Read-only check"}: ${target.hostname}${target.pathname}`);
  const { rows } = await client.query(`
    SELECT id, migration_name, checksum, finished_at, rolled_back_at, applied_steps_count
    FROM "_prisma_migrations"
    WHERE migration_name = ANY($1::text[])
    ${apply ? "FOR UPDATE" : ""}
  `, [[duplicate, canonical]]);
  const active = rows.filter((row) => row.rolled_back_at === null);
  if (active.some((row) => row.finished_at === null)) {
    throw new Error("An unresolved incident migration exists; review before repair.");
  }
  const old = active.filter((row) => row.migration_name === duplicate);
  const real = active.filter((row) => row.migration_name === canonical);
  if (old.length !== 1 || real.length !== 1 || real[0].checksum !== canonicalChecksum
    || real[0].applied_steps_count !== 1) {
    throw new Error("Expected one completed canonical migration and one duplicate marker.");
  }
  if (old[0].checksum === replacementChecksum) {
    console.log("Already reconciled; no changes needed.");
  } else {
    if (old[0].checksum !== previousChecksum || old[0].applied_steps_count !== 0) {
      throw new Error("Duplicate was not the known manually resolved marker; review manually.");
    }
    const incident = await client.query(`SELECT to_regclass('"Incident"') IS NOT NULL AS present`);
    if (!incident.rows[0].present) throw new Error("Incident table is missing; refusing metadata repair.");
    console.log(`Verified duplicate marker: ${old[0].id}`);
    console.log(`Checksum: ${previousChecksum} -> ${replacementChecksum}`);
    if (apply) {
      const result = await client.query(`
        UPDATE "_prisma_migrations" SET checksum = $1
        WHERE id = $2 AND checksum = $3 AND applied_steps_count = 0
          AND finished_at IS NOT NULL AND rolled_back_at IS NULL
      `, [replacementChecksum, old[0].id, previousChecksum]);
      if (result.rowCount !== 1) throw new Error("Expected exactly one marker update.");
      console.log("Reconciled one checksum. Application data and historical attempts are unchanged.");
    } else {
      console.log("No changes made. Use --apply after reviewing the target and the checks above.");
    }
  }
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  // Do not print connection strings, passwords or driver error objects.
  console.error(error instanceof Error ? error.message.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted connection]") : "Repair failed.");
  process.exitCode = 1;
} finally {
  await client.end();
}
