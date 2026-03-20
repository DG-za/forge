# Roadmap 🗺️

**Last updated:** 2026-03-21

## Current Phase

### Phase 1: Foundation 🧱

**Epic:** #1 (parent)
**Status:** in progress — research brief pending merge (PR #14)

Project bootstrap, research across agent platforms (Claude, OpenAI, Cursor, Gemini), and architecture decisions. Multi-platform support chosen — Claude Agent SDK + OpenAI Codex SDK behind an `AgentRunner` abstraction.

## Upcoming Phases

### Phase 2: Core Engine ⚙️

**Epic:** #15
**Status:** not started — sub-issues will be created when this phase begins

Build the dispatcher core (#5), worker agent (#7), and cost tracking (#8). This is the engine that reads a GitHub epic, sequences issues, and dispatches AI agents to implement them. The `AgentRunner` abstraction (Claude + OpenAI) gets built here.

### Phase 3: Web UI 📲

**Epic:** #16
**Status:** not started — sub-issues will be created when this phase begins

Mobile-first web dashboard (#10) for triggering runs, monitoring progress, and reviewing results. Makes Forge usable from a phone before advanced features are added. Next.js App Router, server components for data, minimal client interactivity.

### Phase 4: Human-in-the-Loop ❓

**Epic:** #17
**Status:** not started — sub-issues will be created when this phase begins

Questions phase (#6) for batch Q&A before autonomous work begins, ntfy push notifications (#9) for status updates, and ntfy server setup (#4). The main human touchpoint — answer questions from your phone, get notified on completion or failure.

### Phase 5: Ship It 🚀

**Epic:** #18
**Status:** not started — sub-issues will be created when this phase begins

Dockerize the full stack (#11), deploy to the home server, and run an end-to-end test (#12) against a real epic on a side project. This is the acceptance test for the whole system.

## Completed Phases

(none yet)
