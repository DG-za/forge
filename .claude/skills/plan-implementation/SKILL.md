---
name: plan-implementation
description: Ask clarifying questions, then create a human-readable implementation brief and an agent-ready plan for a GitHub issue
user_invocable: true
argument-hint: [issue-number]
---

# Plan Implementation

Prepare to implement a GitHub issue by first asking clarifying questions, then producing a brief that's useful to the human and a plan that's useful for implementation.

## Input

$ARGUMENTS

## Step 1 — Load the Issue

1. If the user provides an issue number, use it.
2. Otherwise, infer from the current git branch name — parse from `feature/<number>-...` or `bug/<number>-...`.
3. Fetch the issue including comments: `gh issue view <number> --json title,body,comments,labels`
4. Read `CONTEXT.md` and `docs/decisions/` for relevant decisions.
5. Read `WORKFLOW.md` if it exists — this sets the question intensity and mode-specific behaviour for this project.
6. Inspect the codebase — find relevant modules, routes, components, data models, and config.

## Step 2 — Discovery Questions

Before planning, have a structured Q&A conversation. This is the most valuable part of the process — not a gate to get through.

**Question intensity** — check `WORKFLOW.md` for the mode-specific guidance. As a reference:
- **Manual:** 3–6 questions per issue
- **Guided:** 0–3 questions (epic kickoff reduces this significantly)
- **Autonomous:** 1–2 questions max

**Start with this prompt:**
```
💬 Tip: these questions work great with voice-to-speech if you have it set up — faster and more conversational than typing.

Before I start on #<number>, I have a few questions:

1. **<Question>**
   → <Options or suggested answer where genuinely useful — omit if open-ended is better>

2. **<Question>**
   ...
```

### Question design rules

- **Number every question** — the structure signals that this step matters and has a shape.
- **Ask what you don't already know** — don't re-present things already clear from the issue. If success criteria is already well-defined, don't ask about it.
- **Mix open-ended and options** — use open-ended questions where the answer could genuinely surprise you. Present options where there are multiple worthwhile paths the user should consciously choose between. The goal is *decision-maker*, not *brainstormer*.
- **Options anchor — use them intentionally** — listing options helps the user consider paths they might not have thought of. But for preference or intent questions, leave it open so the answer isn't anchored to your framing.
- **Follow-up rounds are fine** — after the first answers come in, ask 1–2 follow-up questions if an answer opens a new question. End when there's genuine clarity, not when you've hit a quota.
- **Leave a stray thought if useful** — if something doesn't fit neatly as a question but is worth flagging, add it as a final note: *"One more thing worth considering: ..."*

### Recording answers

Post all Q&A as a comment on the GitHub issue before proceeding — this is the record the review agent will read:

```bash
gh issue comment <number> --body "## Planning Q&A

**Q: <question>**
A: <answer>

**Q: <question>**
A: <answer>"
```

## Step 3 — Produce the Implementation Brief

The brief is for the **human**. It tells them what's happening at a level they can scan in 60 seconds. Not file names. Not step sequences. The things they'd actually want to weigh in on.

Save to `docs/planning/<issue-number>/<issue-number>-brief.md`:

```markdown
# Brief: <issue title>

## What we're building

<2–4 sentences. What the user will be able to do when this is done. Plain language.>

## Features in scope

- <Feature 1 — one line>
- <Feature 2 — one line>
- ...

## Out of scope (for this issue)

- <Anything explicitly excluded — helps set expectations>

## Architectural decisions to make

<!-- Only list genuine decision points — things where a reasonable person could go either way -->
<!-- Include a suggested direction for each -->

| Decision | Options | Suggested |
|---|---|---|
| <e.g. Where does validation live?> | <Option A / Option B> | <Suggested + one-line reason> |

If there are no real decisions to make, omit this section.

## Uncertain or risky areas

- <Anything that might be harder than expected, have unknown behaviour, or need investigation>

If nothing is uncertain, omit this section.
```

Present the brief to the user and ask: "Anything you'd like to change before I start?"

## Step 4 — Produce the Agent Plan (internal)

This is for the agent's use during implementation — not presented to the user unless they ask. Save to `docs/planning/<issue-number>/<issue-number>-implementation.md`.

```markdown
## Issue Summary
<bullets>

## Current State
<relevant files, existing behaviour, gaps>

## Steps

### Step 1: <title>
- Files to create/modify, with paths
- What changes and why
- Tests to add

### Step 2: <title>
...

## Assumptions
<anything inferred that wasn't confirmed>
```

## Step 5 — Proceed Based on Work Mode

Check `CONTEXT.md` for `Work Mode`.

### Manual mode
Present the brief. Stop. Wait for explicit approval before writing any code.

### Autonomous or Guided mode
Present the brief. Wait briefly (10–15 seconds or one user message) for any objections. Then begin implementation immediately.

## During Implementation — Scope Discipline

When implementing, if any decision is made that **deviates from the original issue scope** — something deferred, something added, something changed — post a comment on the GitHub issue immediately:

```bash
gh issue comment <number> --body "Scope decision: <what changed and why>. Follow-up: <issue link or 'none needed'>."
```

This keeps the review agent informed and prevents it from flagging intentional deferrals as missing work.

## Guidelines

- Questions should surface real ambiguity — not generate process overhead.
- The brief is a communication tool, not a specification. Keep it short.
- The agent plan is thorough — the user doesn't need to read it.
- Commit after every meaningful step during implementation.
- Update `CONTEXT.md` if new patterns or decisions emerge.
