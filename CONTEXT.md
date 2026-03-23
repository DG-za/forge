# Forge — Context

## Project

**What:** Fire-and-forget autonomous task runner — dispatches AI agents to work through GitHub epics
**Stack:** TypeScript, Claude Agent SDK + OpenAI Codex SDK, Next.js, Prisma + Postgres, Docker
**Owner:** Stefan Els

## Work Mode

`manual` — AI creates a plan and waits for approval before implementing.

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

## Design Philosophy

- **File size is a smell, not a rule.** The real concern is single responsibility and consistent abstraction level. A module should operate at one level of abstraction — don't mix high-level orchestration with low-level details. If a module does that, refactor regardless of LOC. If a module has one clear purpose at one abstraction level, it can exceed 150 lines with justification.

## Patterns and Conventions

- Dispatcher logic lives in `src/dispatcher/` as a pure library — no HTTP concerns. Web layer calls into it.
- `AgentRunner` interface abstracts platform differences. `ClaudeRunner` and `OpenAIRunner` implement it.
- `IssueFetcher` interface abstracts issue sources. GitHub is one implementation — text files, Jira, etc. can plug in. Planner consumes `EpicContext`, not GitHub directly.
- Three agent roles: Planner (strong reasoning model), Coder (cost-effective model, TDD), Reviewer (different vendor than Coder).
- Planner output is Zod-validated JSON. Agent returns structured `Plan` with ordered `PlannedTask` items.
- Coder uses `runCoder` with retry loop (default 7 attempts): agent codes → quality gates (lint, typecheck, tests) → fix prompt if failed. `CommandExecutor` injection for testable gate execution.
- Reviewer uses `runReviewer` with review-fix loop (default 4 iterations): reviewer agent → Zod-validated structured feedback (`ReviewFeedback`) → if request_changes, coder fixes → quality gates → re-review. `assertCrossModel` guard enforces different vendor for coder vs reviewer. Escalates after max iterations.
- Pipeline orchestrator uses `runPipeline` to drive the full flow: plan → process each issue (code → review) → replan → budget check → complete. `processIssue` is a pure function chaining coder and reviewer. `createPipelineApi` provides `startRun`/`getRunStatus`/`cancelRun`/`resumeRun` for the web layer. AbortSignal for cancellation between issues.
- Re-planning: after each completed issue, `tryReplan` calls the planner to revise remaining tasks based on outcomes so far. Non-fatal — returns null on failure and continues with original plan.
- Resume after restart: `computeResumeState` is a pure function that reconstructs `ResumeState` from persisted DB rows (plan tasks, completed issues, costs). Pipeline skips planning on resume and picks up from the next incomplete task. `PipelinePersistence` wraps all Prisma calls for run state, plan saving, and issue tracking.
- Persistence is optional via `prisma?` parameter — unit tests work without a database, integration tests use Testcontainers.
- Shared `addCost` utility in `cost.utils.ts` — pure function for accumulating `Cost` values (used by coder, reviewer, pipeline).
- Cost tracking: `AgentLog` records persisted per agent invocation (role, platform, model, tokens, cost, duration). `processIssue` uses `onAgentComplete` callback to report coder/reviewer completions. Planner log attached to first issue. `BudgetWarning` event emitted via `StateChangeListener` at 80% budget (once per run).
- State machine: pure function transition validation (`transitionRun`, `transitionIssue`) + persistence layer. `StateChangeEvent` supports `run`, `issue`, and `budget_warning` kinds.
- Prisma v7 requires a driver adapter — use `@prisma/adapter-pg` with `pg.Pool`. Import PrismaClient from `generated/prisma/client.js` (custom output path), not from `@prisma/client`.

## References

- [Epic #1 — Forge overview](https://github.com/DG-za/forge/issues/1)
- [second-brain #21 — Original idea](https://github.com/DG-za/second-brain/issues/21)
