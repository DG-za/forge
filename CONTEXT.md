# Forge — Context

## Project

**What:** Fire-and-forget autonomous task runner — dispatches AI agents to work through GitHub epics
**Stack:** TypeScript, Claude Agent SDK + OpenAI Codex SDK, Next.js, Prisma + Postgres, Docker
**Owner:** Stefan Els

## Work Mode

`autonomous` — AI creates a plan, then implements immediately. PRs are created but never merged without approval.

## Key Decisions

- **Agent platform:** Multi-platform — Claude Agent SDK + OpenAI Codex SDK behind an `AgentRunner` abstraction. Dispatcher and workers can use different platforms (mix and match). See `docs/decisions/001-multi-platform-agent-support.md`.
- **Model selection:** Platform + model configurable per role (planner, coder, reviewer). No default preference — user picks per epic run.
- **Workflow pipeline:** Deterministic Planner → Coder → Reviewer pipeline. Cross-model review (reviewer must be a different vendor than coder). Max 4 review-fix iterations. Deterministic quality gates (lint, types, tests) before AI review. See `docs/decisions/004-autonomous-workflow-pipeline.md`.
- **Worker execution:** Self-hosted Docker containers on home server. No cloud-hosted execution.
- **GitHub auth:** Personal access token (PAT) for workers to clone, push, and create PRs on target repos.
- **Budget:** Per-epic budget caps (not per-issue). Display in USD.
- **Architecture:** No CLI — web UI + backend only. Dispatcher is a library (`src/dispatcher/`) called by Next.js API routes/server actions. One process, one deployment.
- **Database:** Postgres via Prisma ORM. Stores run state, costs, issue progress. Enables resume after restarts.
- **Testing:** Strict TDD — write tests first, then implement. Applies to all Forge code and to worker agents dispatched by Forge. No implementation before tests. See `PROJECT.md` for the full workflow and `docs/decisions/003-tdd-testing-strategy.md` for rationale.
- **Local-first:** Everything runs locally via Docker Compose. Tests use Testcontainers for Postgres (no DB mocks). Only mock LLM APIs (expensive/external). See `PROJECT.md` for full rules.

## Patterns and Conventions

- Dispatcher logic lives in `src/dispatcher/` as a pure library — no HTTP concerns. Web layer calls into it.
- `AgentRunner` interface abstracts platform differences. `ClaudeRunner` and `OpenAIRunner` implement it.
- `IssueFetcher` interface abstracts issue sources. GitHub is one implementation — text files, Jira, etc. can plug in. Planner consumes `EpicContext`, not GitHub directly.
- Three agent roles: Planner (strong reasoning model), Coder (cost-effective model, TDD), Reviewer (different vendor than Coder).
- Planner output is Zod-validated JSON. Agent returns structured `Plan` with ordered `PlannedTask` items.
- Coder uses `runCoder` with retry loop (default 7 attempts): agent codes → quality gates (lint, typecheck, tests) → fix prompt if failed. `CommandExecutor` injection for testable gate execution.
- State machine: pure function transition validation (`transitionRun`, `transitionIssue`) + persistence layer.
- Prisma v7 requires a driver adapter — use `@prisma/adapter-pg` with `pg.Pool`. Import PrismaClient from `generated/prisma/client.js` (custom output path), not from `@prisma/client`.

## References

- [Epic #1 — Forge overview](https://github.com/DG-za/forge/issues/1)
- [second-brain #21 — Original idea](https://github.com/DG-za/second-brain/issues/21)
