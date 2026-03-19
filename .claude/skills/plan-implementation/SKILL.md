---
name: plan-implementation
description: Create a detailed implementation plan for a GitHub issue and save it as an artifact
user_invocable: true
argument-hint: [issue-number]
---

# Plan Implementation

Create a detailed implementation plan for a GitHub issue before writing any code.

## Input

$ARGUMENTS

## Issue Loading

1. If the user provides an issue number, use it.
2. Otherwise, infer from the current git branch name — parse the issue number from `feature/<number>-...` or `bug/<number>-...`.
3. Fetch the issue: `gh issue view <number>`

## Process

1. **Summarise the issue** in 3–6 bullets: objective, constraints, non-goals, acceptance criteria.
2. **Inspect the codebase** — find relevant modules, routes, components, data models, types, and config.
3. **Identify gaps** — what already exists vs. what is missing. Be explicit.
4. **Read `docs/decisions/`** for any architecture decisions that affect this work.
5. **Propose a step-by-step plan** — each step should be independently implementable and committable.

## Plan Requirements

Every plan must address:

- **What to build** — files to create or modify, with specific paths.
- **Tests to add** — unit tests for logic, integration tests for data access, E2E tests for user-facing workflows (if applicable to the project's stack).
- **Docs to update** — README, CONTEXT.md, decision docs if a new architectural pattern is introduced.

## Output

Save the plan to `docs/planning/<issue-number>/<issue-number>-implementation.md`. Create directories if needed.

Format:

```markdown
## Issue Summary

- Bullets

## Current State Analysis

- Relevant files/modules
- Existing behaviour
- Gaps / missing pieces

## Plan of Action

### Step 1: <short title>

- File locations, what to add/change, and why
- Tests to add or update
- Config or docs changes if needed

### Step 2: <short title>

...

## Risks / Open Questions

- Bullets (if any)
```

## Next Step

After saving the plan, enter Claude Code's built-in plan mode (`/plan`) and present the plan to the user for interactive review.

**Do not begin implementation until the user approves the plan** (unless the project is in autonomous work mode — check CONTEXT.md for `Work Mode`).

## Guidelines

- Prefer concrete file paths and function names over vague descriptions.
- Keep steps small and ordered — each step = one commit.
- Do not implement code in this skill — only plan.
- If information is missing, list assumptions and flag questions.
- During implementation (after approval), commit after every step.
