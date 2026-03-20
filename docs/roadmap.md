# Roadmap 🗺️

**Last updated:** 2026-03-21

## Current Phase

### Phase 1: Foundation 🧱

**Epic:** #1 (parent)
**Status:** in progress — research brief pending merge (PR #14)

Project bootstrap, research across agent platforms (Claude, OpenAI, Cursor, Gemini), and architecture decisions. Multi-platform support chosen — Claude Agent SDK + OpenAI Codex SDK behind an `AgentRunner` abstraction. Autonomous workflow pipeline designed (Planner → Coder → Reviewer with cross-model review).

## Upcoming Phases

### Phase 2: Core Engine ⚙️

**Epic:** #15
**Status:** not started — sub-issues will be created when this phase begins

Build the core autonomous pipeline: `AgentRunner` abstraction (Claude + OpenAI), Planner agent (epic decomposition), Coder agent (TDD loop), Reviewer agent (cross-model review), deterministic quality gates (lint, type-check, tests), review-fix loop (max 4 iterations), cost tracking, and state machine. This is the engine that powers everything else.

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

(none yet)
