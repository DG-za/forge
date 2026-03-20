# Roadmap 🗺️

**Last updated:** 2026-03-21

## Current Phase

### Phase 2: Core Engine ⚙️

**Epic:** #15
**Status:** in progress — 0/8 issues done

Build the core autonomous pipeline. Issues in dependency order:

1. #21 — Prisma + Postgres schema
2. #22 — AgentRunner abstraction (Claude + OpenAI)
3. #23 — Dispatcher state machine
4. #24 — Planner agent
5. #25 — Coder agent (TDD + quality gates)
6. #26 — Reviewer agent (cross-model review + fix loop)
7. #27 — Cost tracking and budget enforcement
8. #28 — Pipeline orchestrator (end-to-end flow)

## Upcoming Phases

### Phase 3: Web UI 📲

**Epic:** #16
**Status:** not started — sub-issues will be created when this phase begins

Mobile-first web dashboard for triggering runs, monitoring progress, and reviewing results. Makes Forge usable from a phone before advanced features are added. Next.js App Router, server components for data, minimal client interactivity.

### Phase 4: AI Chat + MCPs 💬

**Epic:** #19
**Status:** not started — sub-issues will be created when this phase begins

Interactive AI chat interface in the web UI with MCP integrations. Gives mobile access to a Claude/OpenAI assistant with tools like GitHub, TickTick, Gmail — a phone-accessible version of the second-brain Claude bot. Includes MCP management UI, skills system, and session history.

### Phase 5: Human-in-the-Loop ❓

**Epic:** #17
**Status:** not started — sub-issues will be created when this phase begins

Questions phase for batch Q&A before autonomous work begins, ntfy push notifications for status updates, and ntfy server setup. The main human touchpoint — answer questions from your phone, get notified on completion or failure.

### Phase 6: Ship It 🚀

**Epic:** #18
**Status:** not started — sub-issues will be created when this phase begins

Dockerize the full stack, deploy to the home server, and run a live smoke test against a real epic on a side project. Validates the full cycle in production.

### Phase 7: Preview Deployments 🔍

**Epic:** #20
**Status:** not started — sub-issues will be created when this phase begins

When workers create PRs on target repos, automatically deploy a preview so you can see the running app before merging. Convention-based (Dockerfile or framework auto-detection). Accessible at `forge.dgza.co.za/preview/{run_id}`, torn down on merge/close.

## Completed Phases

### Phase 1: Foundation 🧱

**Epic:** #1 (parent)

Project bootstrap, multi-platform research (Claude, OpenAI, Cursor, Gemini), architecture decisions (001–004), TDD workflow, and 7-phase roadmap.
