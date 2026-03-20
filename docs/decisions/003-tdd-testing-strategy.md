# 003 — TDD and Continuous Testing Strategy

> Date: 2026-03-21 | Status: Accepted

## Context

Testing was originally planned as a final phase (#12 — E2E test against a real epic). This leaves all validation to the end, which is risky and contradicts good engineering practice.

## Decision

**Test-driven development integrated into every phase.** No separate testing phase — testing is part of every issue, every PR.

### For Forge's own code (the dispatcher, web UI, etc.)

Each phase includes tests alongside implementation:
- Unit tests for core logic (dispatcher, runner abstraction, cost tracking)
- Integration tests for API routes and database interactions
- E2E tests for critical web UI flows added in Phase 3

### For AI worker agents (when Forge dispatches work)

Workers follow a **TDD loop**:
1. Read the issue and acceptance criteria
2. Write tests that describe the expected behaviour
3. Implement code until tests pass
4. Self-review + PR

This gives the agent a concrete "done" signal and produces tests as a side-effect of every piece of work.

### Issue #12 becomes a smoke test

Issue #12 ("run against a real epic") is no longer the first time we test. It becomes a live smoke test — validating the full cycle on a real repo in production. Everything else is tested before that point.

## Consequences

- Every phase takes slightly longer (tests are written alongside code)
- Worker agent prompt must include TDD instructions
- Higher confidence at every phase boundary
- #12 is a formality, not a prayer
