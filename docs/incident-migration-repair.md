# Incident migration history repair

## What changed

Two migrations previously created the same Incident enums, table and indexes. An empty database applied `20260810130000_add_incident_management` first, then failed at `20260810161453_add_incident_management` with PostgreSQL error 42710 (duplicate IncidentSeverity).

The existing database had a different history: `20260810161453` actually ran, and `20260810130000` was subsequently marked applied with zero executed steps after two rolled-back attempts. Its schema was already correct.

The `20260810130000` file is now a comments-only placeholder. Its name remains in the migration history; the canonical `20260810161453` SQL is unchanged. All other migrations and the Prisma model are unchanged. `.gitattributes` preserves migration line endings so Windows checkouts keep stable checksums.

This is a one-time repair of a known duplicate, not a general license to edit applied migrations. A later migration cannot fix an earlier replay failure. Existing databases need the guarded checksum reconciliation below so Prisma does not report that the manually resolved placeholder was modified.

## Existing databases

Set `DATABASE_URL_UNPOOLED` to the direct connection for the intended database. Prisma commands prefer it when present; the application still uses its existing `DATABASE_URL`. For local PostgreSQL the two URLs may be the same. For Neon, use the direct connection from the console (without `-pooler` in the hostname). Keep connection strings in local environment variables or the hosting provider's secret settings.

First inspect the repair without writing:

```sh
pnpm db:repair-incident-history
```

For the known history only, apply the repair:

```sh
pnpm db:repair-incident-history --apply
pnpm db:deploy
```

The repair script:

- checks the canonical migration's local and database checksums;
- requires one completed duplicate marker with the known original checksum and zero executed steps;
- rejects unresolved failures, unexpected history, pooled connections and a missing Incident table;
- locks the two migrations' tracking rows and changes exactly one checksum in a transaction;
- preserves the original timestamps, logs, rolled-back attempts and all application records;
- does nothing when run again after a successful repair.

Do not reset a populated database or delete migration tracking rows. If a guard fails, investigate that database's history rather than bypassing it. Do not run the repair as part of every Vercel build.

## Fresh databases

Fresh databases need no history repair:

```sh
pnpm db:deploy
```

For an automated integration check, provide `TEST_DATABASE_URL` for a dedicated empty PostgreSQL database, then run:

```sh
pnpm test:migrations
```

The test deliberately does not use `DATABASE_URL` as a fallback. It refuses a nonempty database, applies every migration, repeats deployment, checks migration status and compares the resulting schema with `prisma/schema.prisma`. It leaves the resulting test database available for inspection. It does not seed or reset any database.

## Verification on 5 September 2026

- Reproduced the original duplicate-type failure on an isolated PostgreSQL database.
- Applied all seven repaired migrations to an empty database on the `fix-incident-migration-20260905` Neon branch.
- Repeated deployment: no pending migrations. Schema comparison against Prisma: no differences.
- Repaired the cloned existing database, repeated the repair and verified every application table's content fingerprint remained unchanged.
- Verified that unexpected checksums and a duplicate recorded as actually executed are rejected; verified that the fresh-install test refuses a populated database.
- Reconciled the existing main database's one manually resolved migration checksum. All application-table fingerprints, historical failed attempts and other migration fields were unchanged.
- Lint for the changed scripts/config and `git diff --check` passed.
- Retained the isolated test branch for inspection and suspended its compute after testing.

## Deployment

Connecting GitHub to Vercel deploys application code. The existing build command generates Prisma Client but does not deploy database migrations. This fix changes migration replay/history only; no application-table change is needed on the existing database. Keep future schema migrations as a separate deployment step using the direct database connection.
