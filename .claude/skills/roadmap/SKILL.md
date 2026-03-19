---
name: roadmap
description: Generate or refresh the project roadmap — high-level phases with linked GitHub epics
user_invocable: true
---

# Roadmap 🗺️

Generate or refresh the project's long-term implementation plan. Each phase becomes a GitHub epic. Sub-issues are created when a phase starts, not upfront.

## Step 1 — Check for Existing Roadmap

Read `docs/roadmap.md` if it exists. If not, this is a fresh generation.

## Step 2 — Gather Context

Read these to understand the project's current state and direction:

1. `CONTEXT.md` — project description, stack, work mode, decisions
2. `README.md` — what the project is and what exists
3. `docs/architecture.md` — if it exists, current structure
4. Open GitHub issues and epics:
   ```bash
   gh issue list --state open --json number,title,labels,body --limit 50
   ```
5. Closed issues (for understanding what's been done):
   ```bash
   gh issue list --state closed --json number,title,labels --limit 30
   ```

## Step 3 — Generate or Refresh

### If no roadmap exists — generate

1. Analyse the project's state: what's built, what's planned (open issues/epics), what's missing.
2. Propose 3–6 high-level phases that take the project from current state to "feature complete".
3. Each phase should be:
   - A coherent chunk of work (1–2 weeks of effort)
   - Named clearly (e.g. "Phase 3: Mobile web UI 📲")
   - Described in 2–3 sentences
   - Ordered by dependency and priority
4. Present the roadmap to the user for review. Adjust based on feedback.
5. After approval, create a GitHub epic for each phase:
   - Title: the phase name
   - Body: the 2–3 sentence description + "Sub-issues will be created when this phase starts."
   - Labels: `epic` + relevant domain label
   - Link as sub-issues of a parent epic if one exists
6. Write `docs/roadmap.md` with the format below.

### If roadmap exists — refresh

1. Check each phase's epic status (open/closed, sub-issue progress).
2. Update the roadmap to reflect current reality.
3. If the current phase is complete (all sub-issues closed):
   - Move it to "Completed Phases"
   - Flag the next phase: "Phase X is complete. Ready to start Phase Y?"
4. If phases need reordering or new phases are needed, propose changes.

## Step 4 — Start a Phase (when asked)

When the user says to start the next phase:

1. Read the phase description from the roadmap.
2. Read `CONTEXT.md` for work mode (autonomous/manual).
3. **Create sub-issues** under the phase's epic:
   - Break the phase into concrete, one-day issues
   - Each issue gets acceptance criteria and labels
   - Link them as sub-issues of the epic via GraphQL API

4. **Autonomous mode:** Create the issues, present a brief summary.
5. **Manual mode:** Propose the issues, wait for approval before creating.

6. Update `docs/roadmap.md` to show the phase as "in progress".

## Roadmap Format

```markdown
# Roadmap 🗺️

**Last updated:** YYYY-MM-DD

## Current Phase

### Phase N: <title> <emoji>

**Epic:** #<number>
**Status:** in progress — X/Y issues done

<2-3 sentence description>

## Upcoming Phases

### Phase N+1: <title> <emoji>

**Epic:** #<number>
**Status:** not started — sub-issues will be created when this phase begins

<2-3 sentence description>

### Phase N+2: <title> <emoji>

**Epic:** #<number>
**Status:** not started

<2-3 sentence description>

## Completed Phases

### Phase 1: <title> <emoji>

**Epic:** #<number> (closed)

<2-3 sentence description>
```

## Rules

- **Epics are created with the roadmap** — one epic per phase, created upfront so they're visible in GitHub.
- **Sub-issues are created when a phase starts** — not upfront. The epic body just says "sub-issues will be created when this phase begins."
- **Issues are the source of truth** — the roadmap is a reference doc, not the tracker. Status comes from GitHub.
- **Never close epics or issues** — only the user can do that.
- **Keep phases high-level** — 2-3 sentences each. Details go into the sub-issues when the phase starts.
- **Commit the roadmap** — `docs/roadmap.md` is committed, not gitignored. It's useful context.
