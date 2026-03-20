# Forge — Context

## Project

**What:** Fire-and-forget autonomous task runner — dispatches AI agents to work through GitHub epics
**Stack:** TypeScript, Claude Agent SDK, Next.js, Docker
**Owner:** Stefan Els

## Work Mode

`autonomous` — AI creates a plan, then implements immediately. PRs are created but never merged without approval.

## Key Decisions

- We chose the **Claude Agent SDK** over raw API / LangGraph / CrewAI because it provides built-in tool execution (file I/O, shell, web) out of the box. The tradeoff is Claude-only lock-in, which is acceptable for this project.
- **Opus for dispatcher, Sonnet for workers** — dispatcher needs strong reasoning for planning; workers generate far more tokens so the cheaper model saves significant cost.
- **Sequential workers** (not parallel) — Opus rate limits are strict; parallel agents risk throttling. Can revisit at higher tiers.
- **Docker containers for worker isolation** — `bypassPermissions` mode only inside containers, never on bare metal.

## Patterns and Conventions

- Always set `maxBudgetUsd` and `maxTurns` on every `query()` call to prevent runaway costs.
- Load project conventions via `settingSources: ["project"]` so workers follow CLAUDE.md/AGENTS.md.
- Track cumulative cost manually across workers — the SDK doesn't aggregate across sessions.

## References

- [Epic #1 — Forge overview](https://github.com/DG-za/forge/issues/1)
- [second-brain #21 — Original idea](https://github.com/DG-za/second-brain/issues/21)
