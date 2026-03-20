# 004 — Autonomous Workflow Pipeline

> Date: 2026-03-21 | Status: Accepted

## Context

Forge needs a defined workflow for how agents move work through an epic. We researched production autonomous coding pipelines (Stripe, Cursor, Devin, SWE-agent, Factory AI) and academic studies of agent PR success/failure modes.

Key findings from research (see `docs/briefs/agent-sdk-research.md`):
- Deterministic orchestration beats self-orchestrating agents
- Cross-model review catches bugs that same-model review misses (self-agreement bias)
- PRs under 500 lines have 30-40% better outcomes
- 3-4 review iterations before diminishing returns
- Deterministic quality gates (lint, types, tests) must run before AI review
- Plan upfront, but re-plan after each step based on actual results

## Decision

Three agent roles — **Planner**, **Coder**, **Reviewer** — orchestrated by a deterministic pipeline. The pipeline is fixed; agents execute within bounded tasks but don't decide workflow sequencing.

### Pipeline

```
1. PLAN — Planner decomposes epic into typed, ordered tasks
   Gate: human approval of plan (autonomous mode: brief summary + proceed)

2. For each issue (sequential):

   a. CODE — Coder implements (TDD: tests first, then implement)
      Gate: deterministic checks must pass
        - Lint (ESLint/project linter)
        - Type-check (tsc)
        - Tests (all tests pass)

   b. REVIEW — Reviewer does cross-model code review
      Gate: reviewer approves OR max iterations hit
        - If issues found → Coder fixes → re-run deterministic gates → Reviewer re-reviews
        - Max 4 iterations
        - If still failing after 4 → escalate to human, skip to next issue

   c. PR created + preview deployed (if configured)

   d. RE-PLAN — Planner re-evaluates remaining issues
      - Adjust order, scope, or add issues based on what was learned
      - Skip re-plan if no significant changes

3. After all issues complete:
   - Summary notification to human
   - Human reviews, merges PRs, closes epic
```

### Agent Roles

| Role | Purpose | Recommended model |
|------|---------|-------------------|
| **Planner** | Decompose epics, define acceptance criteria, re-plan after each issue | Strong reasoning (Opus, GPT-5.3) |
| **Coder** | TDD: write tests from acceptance criteria, implement until green, lint/type-check | Cost-effective coding model (Sonnet, Codex) |
| **Reviewer** | Cross-model code review — must be a different model/vendor than the Coder | Different vendor than Coder |

### Cross-Model Review Rule

The Reviewer **must use a different model vendor** than the Coder. This prevents self-agreement bias where the same model family approves its own patterns.

Examples:
- Coder: Claude Sonnet → Reviewer: OpenAI GPT-5.3
- Coder: OpenAI Codex → Reviewer: Claude Opus
- Never: Claude Sonnet → Claude Opus (same vendor, similar biases)

### Quality Gates (deterministic, non-negotiable)

These run automatically after every code change. The pipeline cannot proceed until all pass:

1. **Lint** — project linter (ESLint, etc.)
2. **Type-check** — `tsc --noEmit` or equivalent
3. **Tests** — full test suite must pass

If deterministic gates fail, the Coder fixes them before AI review. The Reviewer never sees code that doesn't compile or pass tests.

### Iteration Limits

| Loop | Max iterations | On limit hit |
|------|---------------|--------------|
| Coder fixing deterministic gates | 7 | Escalate to human |
| Review-fix cycle | 4 | Escalate to human, move to next issue |
| Planner re-planning | 1 per issue | Re-plan is a single pass, not a loop |

### What This Doesn't Include (yet)

- No "review entire epic" step — each PR is reviewed individually, keeping changes small
- No parallel coders — sequential for v1 to avoid merge conflicts
- No automated merge — human always merges

## Alternatives Considered

1. **Self-orchestrating agents** — agent decides what to do next. Research shows these skip steps and get stuck in loops. Rejected.
2. **Same-model review** — cheaper, simpler. Rejected because self-agreement bias is well-documented.
3. **No iteration limit** — risk of infinite loops and runaway costs. Rejected.
4. **Review at epic level instead of PR level** — large diffs overwhelm models (context window, coherence loss). Rejected.

## Sources

- Anthropic 2026 Agentic Coding Trends Report
- McKinsey/QuantumBlack: Agentic Workflows for Software Development
- Devin 2025 Performance Review (Cognition Labs)
- arXiv: Why Agentic-PRs Get Rejected
- CodeScene: Agentic AI Coding Best Practices
- Cross-Model Review research (Zylos, BSWEN)

## Consequences

- Need two SDK integrations from day one (Claude + OpenAI) for cross-model review
- Pipeline is rigid by design — changes require updating the orchestrator, not the agents
- Deterministic gates require target repos to have lint/type-check/test infrastructure
- Re-planning adds a small cost overhead per issue but prevents drift
