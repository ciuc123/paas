@AGENTS.md

## Docker Workflow

**Always use Docker for running commands.** This ensures consistency across environments.

### Common Commands

```bash
# Build the web service image
docker-compose build web

# Run npm build (type check & production build)
docker-compose run --rm web npm run build

# Run development server (with hot reload)
docker-compose up web

# Run linter
docker-compose run --rm web npm run lint

# Run specific npm script
docker-compose run --rm web npm run <script-name>
```

### Key Points
- Use `docker-compose run --rm web <command>` for one-off commands
- Use `docker-compose up web` for development with live reload
- Node modules are cached in Docker volumes (`web_node_modules`), so dependencies persist between runs
- The `.env.local` file is mounted and read by the container
- Port 3000 is exposed for the dev server


