# Roadmap 🗺️

**Last updated:** 2026-04-04

## Current Phase

### Phase 4: AI Chat + MCPs 💬

**Epic:** #19
**Status:** in progress — 1/7 issues done

Interactive AI chat interface in the web UI with MCP integrations. Gives mobile access to a Claude/OpenAI assistant with tools like GitHub, TickTick, Gmail — a phone-accessible version of the second-brain Claude bot. Issues in dependency order:

1. ~~#61 — Chat data model + persistence~~ ✅
2. #62 — MCP server registry — config and lifecycle
3. #63 — Chat backend — streaming AI responses with tool use
4. #64 — Chat UI — message thread + streaming
5. #65 — Tool call UI — show MCP invocations inline
6. #66 — MCP management page
7. #67 — Session history + resume

## Upcoming Phases

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

## Backlog

Non-blocking polish issues from Phase 2:

- #31 — Move model pricing to database 💰
- #33 — Add state transition history table for audit logging 📋
- #34 — Add optimistic concurrency locking to state transitions 🔒

## Completed Phases

### Phase 3: Web UI 📲

**Epic:** #16 (closed)

Mobile-first web dashboard for triggering runs, monitoring progress, and reviewing results. 10 sub-issues completed: layout shell (#40), server actions (#41), dashboard (#42), start run form (#43), run detail page (#44), live polling (#45), form builder (#48), env validation (#52), shadcn/ui migration (#54), feature module refactor (#59).

### Phase 2: Core Engine ⚙️

**Epic:** #15 (closed)

Built the full autonomous pipeline: AgentRunner abstraction, state machine, Planner → Coder → Reviewer flow, cost tracking with budget enforcement, pipeline orchestrator with resume support, and worker agent with git worktree isolation.

### Phase 1: Foundation 🧱

**Epic:** #1 (parent)

Project bootstrap, multi-platform research (Claude, OpenAI, Cursor, Gemini), architecture decisions (001–004), TDD workflow, and 7-phase roadmap.
