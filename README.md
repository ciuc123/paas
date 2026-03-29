# paas

## Project Roadmap

Open [docs/roadmap-swimlanes.md](docs/roadmap-swimlanes.md) to view the visual roadmap for the project.

In VS Code, open the file and use Markdown Preview to render the Mermaid swimlanes.

The live status source of truth is `.github/instructions/*.instructions.md`.

## Paid Product App

The server-enforced paid-access migration now lives in [web](web).

It includes Clerk auth, Stripe checkout/webhooks, and protected roadmap access suitable for deployment on Vercel.

Start from [web/README.md](web/README.md) and [web/.env.example](web/.env.example).

For local containers, the repository now includes [docker-compose.yml](docker-compose.yml) plus [web/Dockerfile](web/Dockerfile). Use `docker compose up --build web` for the app only or `docker compose --profile stripe up --build` to include the Stripe CLI webhook forwarder.

## Online Roadmap

After pushing to `main`, the roadmap is published with GitHub Pages at:

- `https://paas.ciuculescu.com/roadmap/`

The public entry page is [docs/index.html](docs/index.html).

The protected roadmap page is [docs/roadmap/index.html](docs/roadmap/index.html).

The custom domain is configured through [docs/CNAME](docs/CNAME).

## Live Task Status Workflow

Each instruction file in `.github/instructions/` must contain a `## Task Status` markdown table with exactly these columns:

`Task | Status | Notes`

Allowed status values are:

- `done`
- `in_progress`
- `blocked`
- `not_started`

The public roadmap in [docs/index.html](docs/index.html) fetches those instruction files directly from the `main` branch on every page load and renders the real task status in the frontend.

To update project status:

1. Edit the relevant row in `.github/instructions/*.instructions.md`.
2. Keep the status value one of the supported canonical values.
3. Push to `main`.
4. Refresh `https://paas.ciuculescu.com/roadmap/`.

If you change only statuses in `.github/instructions`, the frontend will pick them up on refresh because it reads from GitHub live.

## Clerk Authentication

The static docs site now uses Clerk on the client side.

### GitHub Secrets

Store the Clerk keys in GitHub before publishing:

1. Open the repository on GitHub.
2. Go to `Settings` -> `Secrets and variables` -> `Actions`.
3. Add a secret named `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
4. Add a secret named `CLERK_SECRET_KEY`.

Use these values as follows:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: safe to expose to the browser. This is the value the docs site needs in order to render the Clerk sign-in flow.
- `CLERK_SECRET_KEY`: server-side only. Do not expose this in any file under `docs/` or any browser-delivered JavaScript.

### Current Deployment Behavior

The current GitHub Pages workflow in [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) uploads the `docs` folder directly and does not yet inject GitHub secrets into the published assets.

That means:

1. You should still update [docs/assets/clerk-config.js](docs/assets/clerk-config.js) with the real publishable key if you want the current static site sign-in flow to work.
2. `CLERK_SECRET_KEY` should remain stored only in GitHub secrets until this project adds a server-side integration or a build step that needs it.

If you later add a build or templating step to the Pages workflow, use `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` there to generate [docs/assets/clerk-config.js](docs/assets/clerk-config.js) at deploy time instead of committing the key to the repository.