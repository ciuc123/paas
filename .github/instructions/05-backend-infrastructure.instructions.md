---
description: "Use when planning or implementing backend systems, infrastructure, environments, hosting, auth, storage, AI integrations, deployment, observability, database schema, rules engine, or blueprint APIs. Keywords: backend, infrastructure, environments, hosting, API, database, auth, storage, deployment, observability."
name: "Backend And Infrastructure"
---
# Backend And Infrastructure

Use this instruction when working on the platform backend and operational foundation.

## Core Focus

- Set up the repository structure intentionally, whether as a monorepo or split repositories.
- Define dev, staging, and production environments early.
- Choose a hosting provider based on actual operational needs.
- Implement backend structures and endpoints for the blueprint model.
- Build the rules engine that converts questionnaire answers into technical configuration.
- Implement core modules for auth, storage, AI integration, deployment, and observability.
- Design a database schema that supports users, coaches, tools, configs, sessions, and logs.

## Checklist

- [ ] Decide the repo structure and workspace boundaries.
- [ ] Configure dev, staging, and prod environments.
- [ ] Choose the hosting provider.
- [ ] Implement the backend blueprint model and endpoints.
- [ ] Implement the rules engine.
- [ ] Implement the auth module.
- [ ] Implement the storage module.
- [ ] Implement the AI integration module.
- [ ] Implement the deployment module.
- [ ] Implement logs and observability.
- [ ] Design the database schema.

## Output Expectations

- Favor simple, inspectable services over premature platform complexity.
- Treat environment setup, deployment, and observability as first-class requirements.
- Keep module boundaries clear so the generation flow remains understandable.