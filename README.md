# paas

## Project Roadmap

Open [docs/roadmap-swimlanes.md](docs/roadmap-swimlanes.md) to view the visual roadmap for the project.

In VS Code, open the file and use Markdown Preview to render the Mermaid swimlanes.

The live status source of truth is `.github/instructions/*.instructions.md`.

## Online Roadmap

After pushing to `main`, the roadmap is published with GitHub Pages at:

- `https://paas.ciuculescu.com/`

The public entry page is [docs/index.html](docs/index.html).

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
4. Refresh `https://paas.ciuculescu.com/`.

If you change only statuses in `.github/instructions`, the frontend will pick them up on refresh because it reads from GitHub live.