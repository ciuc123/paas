@AGENTS.md

## Docker Workflow

**Always use Docker for running commands.** This ensures consistency across environments.

### Default command pattern

Use the running app container for one-off commands whenever it is available:

```bash
docker exec -it paas-web-1 sh -lc "cd /app && <command>"
```

This is the preferred workflow for linting, migrations, seed scripts, and quick debugging.

### Common Commands

```bash
# Build the web service image
docker compose build web

# Run npm build (type check & production build)
docker exec -it paas-web-1 sh -lc "cd /app && npm run build"

# Run development server (with hot reload)
docker compose up web

# Run linter
docker exec -it paas-web-1 sh -lc "cd /app && npm run lint"

# Run database migrations
docker exec -it paas-web-1 sh -lc "cd /app && npm run db:migrate"

# Seed local database
docker exec -it paas-web-1 sh -lc "cd /app && npm run db:seed"

# Run specific npm script
docker exec -it paas-web-1 sh -lc "cd /app && npm run <script-name>"
```

### Key Points
- Prefer `docker exec -it paas-web-1 sh -lc "cd /app && ..."` for one-off commands when the container is already running.
- Use `docker compose up web` for development with live reload.
- Fall back to `docker compose run --rm web <command>` only if the main container is not running.
- Node modules are cached in Docker volumes (`web_node_modules`), so dependencies persist between runs.
- The `.env.local` file is mounted and read by the container.
- Port 3000 is exposed for the dev server
