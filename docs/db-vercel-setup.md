# Database Setup: Neon + Vercel (Production) and Docker Compose (Dev)

Last updated: 2026-04-01

This document explains how to enable production and development databases for this repository. It covers Neon + Vercel for production, the local Docker Compose Postgres for development, connection details for local IDEs (PhpStorm), migration & seed commands, CI guidance, and troubleshooting tips.

Quick decision summary
- Production: use Neon Postgres (managed serverless Postgres) and store connection strings in Vercel environment variables.
- Runtime app connections: use pooled connection (DATABASE_URL).
- Migrations / one-off scripts: use direct connection (DATABASE_URL_DIRECT) to avoid exhausting pooled limits.
- Development: use the included local Postgres service in `docker-compose.yml` (hostname `postgres`) with credentials mirrored in `web/.env.local`.

Checklist
- [ ] Create Neon project/cluster and get pooled + direct connection strings
- [ ] Add `DATABASE_URL` and `DATABASE_URL_DIRECT` in Vercel (and GitHub Secrets if you run migrations from CI)
- [ ] Start local Postgres + web with Docker Compose for development
- [ ] Run migrations, seed, and smoke-check locally
- [ ] Connect PhpStorm (or other DB tools) to local instance for inspection

Contents
- Environment variables (exact names)
- Neon / Production setup (step-by-step)
- Local development setup (Docker Compose)
- Commands: migrations, seed, smoke-check
- GitHub Actions (example) for running migrations
- PhpStorm connection guide
- Backups, security, and operational notes
- Troubleshooting
- Repo files referenced

---

Environment variables (exact names used in this repo)
- `DATABASE_URL` — pooled connection string used by the application runtime (Vercel). Example: `postgresql://pooled_user:pwd@pooled-host:5432/paas`.
- `DATABASE_URL_DIRECT` — direct connection string used for migrations and admin tasks. Example: `postgresql://direct_user:pwd@direct-host:5432/paas`.
- The repo also uses these environment variables for app features: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`.

Why two URLs?
- Serverless pools (Neon pooled URL) are optimized for short-lived connections and autoscaling app traffic. Migrations and long-running operations should use a direct connection so they do not consume or block serverless pooled capacity.

---

Neon (Production) setup — step-by-step
1. Create a Neon account and new project (or use your organization project).
2. Create a database/branch for production. In Neon you will typically get two useful connection endpoints:
   - Pooled (serverless) connection string — use for `DATABASE_URL`.
   - Direct (single connection) string — use for `DATABASE_URL_DIRECT` when running migrations/seed.
3. Copy the pooled URL to Vercel as `DATABASE_URL`.
4. Copy the direct URL to Vercel as `DATABASE_URL_DIRECT` (optional, but useful for scripts run through Vercel CLI or one-off admin instances).
5. Add other required secrets in Vercel (Clerk, Stripe, etc.).

Vercel settings (Project → Settings → Environment Variables):
- Add `DATABASE_URL` (Encrypted secret) — Neon pooled URL
- Add `DATABASE_URL_DIRECT` (Encrypted secret) — Neon direct URL
- Add Clerk and Stripe env entries as in `web/.env.local`.

Production migration recommendation
- Run migrations from a CI job or an admin instance with `DATABASE_URL_DIRECT` set so migrations run against the direct connection.
- Example (manual/admin machine):

```bash
DATABASE_URL="<pooled-url>" DATABASE_URL_DIRECT="<direct-url>" npm run db:migrate
```

This repo ships a checked-in SQL migration at `web/drizzle/0000_init.sql` and a small migration runner `web/scripts/migrate.ts` which applies `.sql` files under `web/drizzle/` in order.

---

Local development (Docker Compose)
This repository includes a `postgres` service in `docker-compose.yml` and a `web` service. The `web` service depends on `postgres` and will use the Docker network hostname `postgres`.

Local connection details (used in `web/.env.local`):
- Host: `postgres` (Docker service hostname)
- Port: `5432`
- Database: `paas`
- User: `postgres`
- Password: `postgres`

Local connection string (JS-style):

```text
postgres://postgres:postgres@postgres:5432/paas?sslmode=disable
```

Local JDBC URL (PhpStorm / external IDE):

```text
jdbc:postgresql://localhost:5432/paas?sslmode=disable
```

Note: When PhpStorm runs on your host machine, Docker Desktop exposes container ports to `localhost:5432`. When running compose inside WSL, `localhost` still works in most setups. If you cannot reach it from host, try `host.docker.internal`.

Start local stack (detached):

```bash
# from repo root
docker compose up --build -d postgres web
```

Run migrations, seed, and check (preferred pattern used in this repo):

```bash
# run migrations inside the running web container
docker exec -it paas-web-1 sh -lc "cd /app && npm run db:migrate"

# seed demo data
docker exec -it paas-web-1 sh -lc "cd /app && npm run db:seed"

# smoke check
docker exec -it paas-web-1 sh -lc "cd /app && npm run db:check"
```

Alternatively (host):

```bash
# from web/ with .env.local set to point at postgres host, you can run:
npm run db:migrate
npm run db:seed
npm run db:check
```

---

Migrations and seed scripts in this repo
- `web/drizzle/0000_init.sql` — initial SQL migration (tables + enums + indexes).
- `web/scripts/migrate.ts` — lightweight migration runner that applies `.sql` files in `web/drizzle/` and records runs in `schema_migrations`.
- `web/scripts/seed.ts` — seed script inserting a sample `user`, `billing_accounts`, a sample `project`, lanes and tasks.
- `web/scripts/check-db.ts` — smoke check script that reports connectivity and counts.
- `web/package.json` exposes scripts:
  - `npm run db:migrate`
  - `npm run db:seed`
  - `npm run db:check`

---

GitHub Actions example — run migrations on `main`
Create `.github/workflows/migrate.yml` (example)

```yaml
name: Run DB migrations

on:
  push:
    branches: [ main ]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install & migrate
        working-directory: ./web
        run: |
          npm ci
          npm run db:migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DATABASE_URL_DIRECT: ${{ secrets.DATABASE_URL_DIRECT }}
```

Notes
- Keep `DATABASE_URL_DIRECT` in GitHub Secrets and ensure the migration runner uses it for long-running migrations.
- Consider running migrations manually if they require careful rollout.

---

PhpStorm connection guide (quick)
1. Open PhpStorm → View → Tool Windows → Database.
2. Click + → Data Source → PostgreSQL.
3. Fill in:
   - Host: `localhost`
   - Port: `5432`
   - Database: `paas`
   - User: `postgres`
   - Password: `postgres`
   - JDBC URL (optional): `jdbc:postgresql://localhost:5432/paas?sslmode=disable`
4. Click **Test Connection** (PhpStorm will download JDBC driver if needed).
5. Open Console and run quick queries:

```sql
SELECT now();
SELECT count(*) FROM users;
SELECT id, name FROM projects LIMIT 5;
```

---

Backups, restores, and maintenance
- Neon offers built-in backups and PITR; enable them according to your plan.
- Manual `pg_dump` example (direct URL):

```bash
PGPASSWORD=<password> pg_dump -h <host> -p <port> -U <user> -d <db> -F c -f backup.pgdump
```

Restore example:

```bash
pg_restore -h <host> -p <port> -U <user> -d <db> backup.pgdump
```

---

Security and operational notes
- Do not commit `DATABASE_URL` values to Git. Keep them in Vercel secrets and in local `.env.local` (which should be gitignored).
- Rotate credentials in Neon and update Vercel secrets. Restart or redeploy the app to pick up rotated secrets.
- Use the pooled connection for runtime and direct URL for migrations. Avoid long-lived connections from serverless functions.

---

Troubleshooting
- "Connection refused": ensure the `postgres` container is running and healthy. Check `docker ps` and `docker logs paas-postgres-1`.
- "Authentication failed": verify `POSTGRES_PASSWORD` in `docker-compose.yml` and your `web/.env.local`.
- PhpStorm cannot connect: try `host.docker.internal` if `localhost` fails (less common); ensure Docker Desktop exposes ports.
- Migration fails due to missing extensions: the init SQL uses `pgcrypto`; if your provider restricts `CREATE EXTENSION` you may need to enable it in Neon or remove dependency.

---

Files referenced in this repo (where to look)
- `docker-compose.yml` — local compose (postgres + web + stripe-cli)
- `web/.env.local` — local environment values
- `web/drizzle/0000_init.sql` — initial SQL migration
- `web/scripts/migrate.ts` — migration runner
- `web/scripts/seed.ts` — seed script
- `web/scripts/check-db.ts` — smoke check script
- `web/package.json` — scripts for `db:migrate`, `db:seed`, `db:check`
- `web/README.md` — local quickstart (updated to reference these commands)

---

Quick copyable snippets

Start local stack:

```bash
# repo root
docker compose up --build -d postgres web
```

Run migrations + seed + check:

```bash
docker exec -it paas-web-1 sh -lc "cd /app && npm run db:migrate"
docker exec -it paas-web-1 sh -lc "cd /app && npm run db:seed"
docker exec -it paas-web-1 sh -lc "cd /app && npm run db:check"
```

Run migrations in production (manual admin):

```bash
DATABASE_URL="<pooled-url>" DATABASE_URL_DIRECT="<direct-url>" npm run db:migrate
```

---

If you want, I can also:
- Add a GitHub Actions workflow file to the repo that runs `npm run db:migrate` on `main` (using repo secrets).
- Add an admin page in the web app to browse `projects` and `billing_accounts` rows.
- Convert the `seed.ts` to be fully idempotent for projects (seed by project slug/name).

Pick the next step and I’ll implement it in the repo.

