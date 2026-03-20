# Forge — Context

## Project

**What:** Fire-and-forget autonomous task runner — dispatches AI agents to work through GitHub epics
**Stack:** TypeScript, Claude Agent SDK + OpenAI Codex SDK, Next.js, Docker
**Owner:** Stefan Els

## Work Mode

`autonomous` — AI creates a plan, then implements immediately. PRs are created but never merged without approval.

## Key Decisions

- **Agent platform:** Multi-platform — Claude Agent SDK + OpenAI Codex SDK behind an `AgentRunner` abstraction. Dispatcher and workers can use different platforms (mix and match). See `docs/decisions/001-multi-platform-agent-support.md`.
- **Model selection:** Platform + model configurable per role (dispatcher vs worker). Enables Claude Opus for planning + OpenAI Codex for implementation, or any combination.

## Patterns and Conventions

<!-- Record established patterns. Format: "All API calls go through api.ts wrapper." -->
<!-- This section is auto-updated by the AI agent when new patterns are agreed on. -->

## References

- [Epic #1 — Forge overview](https://github.com/DG-za/forge/issues/1)
- [second-brain #21 — Original idea](https://github.com/DG-za/second-brain/issues/21)
