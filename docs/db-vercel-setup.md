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

### Do I need auth to create Neon or to use the connection strings?

- Short answer: yes — you need a Neon account (or team access) to create and manage databases. Neon requires you to sign up (email/OAuth) and to authenticate in the dashboard. However, once the database is created the runtime app does not perform Neon-level auth: the app only needs the connection strings (pooled/direct) which act as the credentials.

- Details and automation:
  - Neon Dashboard: sign up and create a project/branch. A user with Dashboard access can view connection strings and run SQL (including enabling extensions such as `pgcrypto`).
  - Neon API & Service Accounts: for automation (CI, infra-as-code) you can create Neon API keys or service accounts. Store those API keys securely — they are not required by the running app, only for programmatic management of Neon from CI.
  - Team / Access Control: add team members in Neon to manage DBs without sharing personal accounts. Use role separation for production access.

If you only want to run your app against the DB, you do not need to keep the Neon dashboard open after you copy connection strings into Vercel. But for migrations or enabling DB extensions you will need an account with sufficient privileges (or a direct connection URL that includes an admin user).

**Tip:** enable the `pgcrypto` extension from the Neon SQL editor (required by the initial migration):

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

This requires a Neon user with permission to run `CREATE EXTENSION`.

---

Vercel: step‑by‑step (UI and CLI)

This section shows the exact Vercel actions to add your Neon connection strings and related secrets, and how to use them safely for deploys and migrations.

1) Add environment variables via the Vercel Dashboard (recommended)

  a. Open your Vercel project at https://vercel.com/dashboard.
  b. Go to Settings → Environment Variables.
  c. Click "Add" and fill in the form:
     - Name: `DATABASE_URL`
     - Value: (paste the Neon pooled connection string)
     - Environment: select `Production` (and optionally add the same variable for `Preview` and `Development` if needed)
     - Click **Save**.
  d. Repeat for `DATABASE_URL_DIRECT` (paste the Neon direct connection string). You can set this for `Production` as well, but limit where you expose it—prefer storing it only in secrets accessible to migration runners.
  e. Add other secrets: `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, etc.

2) Add environment variables via Vercel CLI (alternate)

  - Install/verify `vercel` and run:

```bash
# login if needed
vercel login

# add pooled URL (production)
vercel env add DATABASE_URL production

# add direct URL (production)
vercel env add DATABASE_URL_DIRECT production
```

Follow the prompts and paste the values when asked. Repeat for other secrets.

3) Store migration secrets in GitHub (for CI-run migrations)

  - Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret.
  - Add `DATABASE_URL` and `DATABASE_URL_DIRECT` (or a single `PROD_DATABASE_URL_DIRECT`) so your CI job can run migrations.

4) Deploy your app in Vercel

  - With Vercel Git integration enabled, push to `main` (or your production branch). Vercel will deploy automatically and your app will pick up `DATABASE_URL` from the project settings.
  - You can also run `vercel --prod` from the CLI to create a production deployment.

5) Run migrations (recommended patterns)

  - Manual/admin run (safe): run migrations from your admin machine with `DATABASE_URL_DIRECT` in the environment:

```bash
DATABASE_URL="<pooled-url>" DATABASE_URL_DIRECT="<direct-url>" npm run db:migrate
```

  - CI-run migration (recommended if you want automation): use a GitHub Actions job that uses `DATABASE_URL_DIRECT` from Secrets, then runs `npm run db:migrate`. See the example in this doc.

6) Running one-off commands on Vercel instances (not recommended for migrations)

  - Vercel supports one-off serverless invocations, but we recommend running schema changes via `DATABASE_URL_DIRECT` from CI or an admin shell rather than in build hooks or serverless runtime.

7) Post-deploy verification

  - After deploy, verify the app can connect and observe the app logs for DB connection errors.
  - Use the Neon dashboard or `psql` against the direct URL to inspect and verify schema/tables.

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
