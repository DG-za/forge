# Roadmap 🗺️

**Last updated:** 2026-03-22

## Current Phase

### Phase 3: Web UI 📲

**Epic:** #16
**Status:** in progress — 0/6 issues done

Mobile-first web dashboard for triggering runs, monitoring progress, and reviewing results. Issues in dependency order:

1. #40 — Tailwind CSS + layout shell
2. #41 — Server actions for pipeline data
3. #42 — Dashboard — run list page
4. #43 — Start run form
5. #44 — Run detail page
6. #45 — Live status polling

## Upcoming Phases

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

### Phase 2: Core Engine ⚙️

**Epic:** #15
**Status:** core complete — 8/8 pipeline issues closed

Built the full autonomous pipeline: AgentRunner abstraction, state machine, Planner → Coder → Reviewer flow, cost tracking with budget enforcement, and pipeline orchestrator with resume support. Three non-blocking polish issues remain open (#31 model pricing to DB, #33 audit logging, #34 optimistic concurrency).

### Phase 1: Foundation 🧱

**Epic:** #1 (parent)

Project bootstrap, multi-platform research (Claude, OpenAI, Cursor, Gemini), architecture decisions (001–004), TDD workflow, and 7-phase roadmap.
