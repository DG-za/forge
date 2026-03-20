# Forge — Context

## Project

**What:** Fire-and-forget autonomous task runner — dispatches AI agents to work through GitHub epics
**Stack:** TypeScript, Claude Agent SDK, Next.js, Docker
**Owner:** Stefan Els

## Work Mode

`autonomous` — AI creates a plan, then implements immediately. PRs are created but never merged without approval.

## Key Decisions

- **Agent platform:** Pending — researched Claude Agent SDK, OpenAI Codex SDK, Cursor Cloud, Google ADK. See `docs/briefs/agent-sdk-research.md` for full comparison.

## Patterns and Conventions

<!-- Record established patterns. Format: "All API calls go through api.ts wrapper." -->
<!-- This section is auto-updated by the AI agent when new patterns are agreed on. -->

## References

- [Epic #1 — Forge overview](https://github.com/DG-za/forge/issues/1)
- [second-brain #21 — Original idea](https://github.com/DG-za/second-brain/issues/21)
