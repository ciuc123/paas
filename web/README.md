## Web App (Paid Access)

This folder contains the production migration path from static GitHub Pages to a server-capable app using:

- Next.js App Router
- Clerk authentication
- Stripe subscriptions
- Neon Postgres + Drizzle ORM
- Server-enforced paid access for `/roadmap`

## Preferred local command workflow

Use the running Docker container for app commands in this repo:

```bash
docker exec -it paas-web-1 sh -lc "cd /app && <command>"
```

Examples:

```bash
docker exec -it paas-web-1 sh -lc "cd /app && npm run lint"
docker exec -it paas-web-1 sh -lc "cd /app && npm run db:migrate"
docker exec -it paas-web-1 sh -lc "cd /app && npm run db:seed"
docker exec -it paas-web-1 sh -lc "cd /app && npm run db:check"
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create `web/.env.local`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PRICE_ID=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
SKIP_STRIPE_WEBHOOK_SIGNATURE_VERIFICATION=false
DATABASE_URL=postgres://postgres:postgres@postgres:5432/paas?sslmode=disable
DATABASE_URL_DIRECT=postgres://postgres:postgres@postgres:5432/paas?sslmode=disable
```

3. Start local development with the bundled Postgres service:

```bash
docker compose up --build -d postgres web
```

4. Run database migrations, seed data, and a smoke check:

```bash
docker exec -it paas-web-1 sh -lc "cd /app && npm run db:migrate"
docker exec -it paas-web-1 sh -lc "cd /app && npm run db:seed"
docker exec -it paas-web-1 sh -lc "cd /app && npm run db:check"
```

5. Run Stripe webhook forwarding in another terminal:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

6. Open [http://localhost:3000](http://localhost:3000).

## Database layout

Current schema files live in:

- `drizzle.config.ts`
- `src/db/schema.ts`
- `drizzle/0000_init.sql`
- `scripts/migrate.ts`
- `scripts/seed.ts`
- `scripts/check-db.ts`

Core tables:

- `users`
- `billing_accounts`
- `projects`
- `project_lanes`
- `project_tasks`
- `stripe_webhook_events`
- `schema_migrations`

## Local testing data

The seed script creates:

- one sample Clerk-linked user: `user_seed_coach`
- one paid billing account on plan `pro`
- one sample project with two lanes and four tasks

Run it again safely; the user and billing row are upserted.

## Docker Development

1. Create `web/.env.local` from your local values.

2. For the Docker-based Stripe workflow, set:

```bash
SKIP_STRIPE_WEBHOOK_SIGNATURE_VERIFICATION=true
```

This keeps production webhook verification intact while allowing the local Stripe CLI container to forward events without rotating a signing secret into the app container.

3. Start the Next.js app and database in Docker:

```bash
docker compose up --build -d postgres web
```

4. Start the full local stack, including Stripe webhook forwarding:

```bash
docker compose --profile stripe up --build -d
```

The Stripe CLI sidecar forwards events to `http://web:3000/api/stripe/webhook` inside the Compose network. Clerk and Stripe still remain external services, so you must provide valid test keys in `web/.env.local`.

## Flow

1. User signs in with Clerk.
2. `/roadmap` checks paid entitlement in Clerk private metadata.
3. If unpaid, user is redirected to `/upgrade`.
4. `/upgrade` starts Stripe Checkout via `/api/stripe/create-checkout-session`.
5. Stripe webhook updates Clerk metadata (`paidAccess`, `stripeStatus`).
6. Neon Postgres stores durable app data for users, projects, and billing records.
7. User can access `/roadmap` after successful payment.

## Generate and evolve migrations

The app now uses a checked-in SQL migration plus a lightweight migration runner.

When you change the schema, update `drizzle/0000_init.sql` or add a new numbered `.sql` migration file, then apply it with:

```bash
docker exec -it paas-web-1 sh -lc "cd /app && npm run db:migrate"
```

Optional Drizzle commands remain available for schema experimentation:

```bash
docker exec -it paas-web-1 sh -lc "cd /app && npm run db:generate"
docker exec -it paas-web-1 sh -lc "cd /app && npm run db:push"
docker exec -it paas-web-1 sh -lc "cd /app && npm run db:studio"
```

## Deploy (Vercel + Neon)

1. Create a Neon project and database.
2. Copy the pooled connection string into Vercel as `DATABASE_URL`.
3. Copy the direct connection string into Vercel as `DATABASE_URL_DIRECT`.
4. Set these additional Vercel variables:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `DATABASE_URL`
- `DATABASE_URL_DIRECT`

5. Before or during deploy, run migrations against production:

```bash
DATABASE_URL="<pooled-url>" DATABASE_URL_DIRECT="<direct-url>" npm run db:migrate
```

6. Seed production only if you explicitly want demo data:

```bash
DATABASE_URL="<pooled-url>" DATABASE_URL_DIRECT="<direct-url>" npm run db:seed
```

7. Configure Stripe webhook endpoint for production:

- `https://<your-domain>/api/stripe/webhook`

## Production notes

- Use Neon pooled connections for app traffic.
- Use the direct Neon connection for migrations and one-off scripts when available.
- Keep Clerk as the identity provider.
- Treat Postgres as the source of truth for projects and billing records.
- You can still mirror summary billing state back into Clerk private metadata for fast access checks.
