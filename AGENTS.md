# AGENTS.md

## Project Overview

Fire-and-forget autonomous task runner — dispatches AI agents to work through GitHub epics. TypeScript dispatcher using the Claude Agent SDK, with a Next.js mobile-first web UI for triggering and monitoring.

**Stack:** TypeScript, Claude Agent SDK, Next.js, Docker

## Common Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run format:check # Check formatting
npm run typecheck    # TypeScript type checking
```

## Directory Structure

```
src/
  app/               # Next.js App Router — thin route pages only
  features/          # Feature modules — all domain logic
  components/        # Shared UI components
  dispatcher/        # Task runner — dispatches agents to work through epics
  lib/               # Shared utilities and singletons
  shared/            # Shared types and config
agents/              # Rule fragments imported by CLAUDE.md
docs/
  decisions/         # Architecture decision records
```

## Git Workflow

- All PRs target `main`
- Branch naming: `feature/<number>-<description>` or `bug/<number>-<description>`
- Branches are auto-deleted on merge
