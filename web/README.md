## Web App (Paid Access)

This folder contains the production migration path from static GitHub Pages to a server-capable app using:

- Next.js App Router
- Clerk authentication
- Stripe subscriptions
- Server-enforced paid access for `/roadmap`

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` in `web/`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PRICE_ID=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
SKIP_STRIPE_WEBHOOK_SIGNATURE_VERIFICATION=false
```

3. Start local development:

```bash
npm run dev
```

4. Run Stripe webhook forwarding in another terminal:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

5. Open [http://localhost:3000](http://localhost:3000).

## Docker Development

1. Create `web/.env.local` from [web/.env.example](./.env.example).

2. For the Docker-based Stripe workflow, set:

```bash
SKIP_STRIPE_WEBHOOK_SIGNATURE_VERIFICATION=true
```

This keeps production webhook verification intact while allowing the local Stripe CLI container to forward events without rotating a signing secret into the app container.

3. Start the Next.js app in Docker:

```bash
docker compose up --build web
```

4. Start the full local stack, including Stripe webhook forwarding:

```bash
docker compose --profile stripe up --build
```

The Stripe CLI sidecar forwards events to `http://web:3000/api/stripe/webhook` inside the Compose network. Clerk and Stripe still remain external services, so you must provide valid test keys in `web/.env.local`.

## Flow

1. User signs in with Clerk.
2. `/roadmap` checks paid entitlement in Clerk private metadata.
3. If unpaid, user is redirected to `/upgrade`.
4. `/upgrade` starts Stripe Checkout via `/api/stripe/create-checkout-session`.
5. Stripe webhook updates Clerk metadata (`paidAccess`, `stripeStatus`).
6. User can access `/roadmap` after successful payment.

## Deploy (Vercel)

Set these variables in Vercel project settings:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`

Configure Stripe webhook endpoint for production:

- `https://<your-domain>/api/stripe/webhook`

For Clerk + Stripe production hardening, add retries/idempotency and a persistent billing table once you introduce a database.
