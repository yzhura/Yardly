# @yardly/database

Prisma schema and migrations for Yardly.

## Daily dev (migrations)

From the **repo root**:

```bash
npm run db:migrate
```

This runs `prisma migrate dev` in this package (creates/applies migrations, regenerates the client when needed).

Use a **direct** Postgres URL (port `5432`) in `packages/database/.env` for `migrate dev`. Transaction pooler / PgBouncer URLs often break migrations or shadow DB checks.

## Deploy / CI

Apply already committed migrations without prompts:

```bash
npm run db:migrate:deploy
```

## After you used `db push` (drift)

If `migrate dev` reports drift but the database already matches the SQL in `prisma/migrations`, mark those migrations as applied:

```bash
cd packages/database
npx prisma migrate resolve --applied "20260405150500_init_auth_multitenant"
npx prisma migrate resolve --applied "20260405160000_invitations"
npx prisma migrate status
```

If this is a throwaway dev database, you can instead reset and reapply:

```bash
cd packages/database
npx prisma migrate reset
```

## Windows: `EPERM` / `rename ... query_engine-windows.dll.node`

Something is locking Prisma’s query engine (very common on Windows):

1. Stop **all** dev processes for this repo: `npm run dev:admin`, `npm run dev:api`, **Prisma Studio**, test runners, etc.
2. If it still fails, close other terminals in the project or run **Task Manager** → end stray **Node.js** tasks.
3. From the repo root, wipe generated engines and regenerate:

```bash
npm run db:generate:clean
```

If antivirus scans `node_modules` aggressively, add an exclusion for the repo folder or for `node_modules\.prisma`.

## Emergency schema sync (avoid in normal dev)

`prisma db push` is still available inside this package as `npm run db:push` — it skips migration history and causes drift relative to `migrate dev`. Prefer migrations.
