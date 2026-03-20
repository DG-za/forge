# 002 — Backend Architecture

> Date: 2026-03-21 | Status: Accepted

## Context

Forge needs a way to trigger and monitor agent runs. Options: standalone CLI, web backend, or both.

## Decision

**Web backend only** — no separate CLI. The dispatcher is a library (`src/dispatcher/`) that the Next.js app calls via API routes or server actions.

### Structure

```
src/
  app/           # Next.js web UI + API routes
  dispatcher/    # Core orchestration library (pure logic, no HTTP)
  shared/        # Shared types
```

### Key choices

- **Postgres + Prisma** for state persistence. Stores run state, issue progress, cost tracking. Enables resume after restarts and queryable history for the web UI.
- **Self-hosted Docker** for worker execution. No cloud-hosted containers.
- **GitHub PAT** for repo access (clone, push, create PRs on target repos).
- **Per-epic budget caps** displayed in USD.

## Alternatives Considered

1. **CLI + web UI** — CLI for dev, web UI for production. More flexible but adds a second entry point to maintain. Can always `curl` the API for terminal access.
2. **CLI only** — Doesn't serve the mobile-first goal (trigger from phone).
3. **Dispatcher inside web server process** with JSON file state — fragile (restarts kill runs, no queryable history). Postgres solves this.

## Consequences

- One deployment target (Next.js app + Postgres)
- Dispatcher must be designed as a library with no HTTP coupling
- Need Postgres in dev environment (Docker Compose or local install)
