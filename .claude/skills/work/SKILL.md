---
name: work
description: Start working on an issue — loads context, creates a branch, and begins planning or implementation
user_invocable: true
argument-hint: [issue-number] [--manual] [--autonomous]
---

# Work on Issue 🎯

Switch focus to a GitHub issue. Creates a branch, loads context, and either plans or implements based on the project's work mode.

## Input

$ARGUMENTS

## Step 1 — Check Current State

Before switching to a new issue, verify the working tree is clean:

1. **Uncommitted changes?**
   ```bash
   git status --porcelain
   ```
   If there are uncommitted changes, ask: "You have uncommitted changes. Want me to commit and push before switching?"

2. **Unpushed commits?**
   ```bash
   git log @{u}..HEAD --oneline 2>/dev/null
   ```
   If there are unpushed commits, ask: "You have unpushed commits on this branch. Want me to push before switching?"

3. **Unmerged branch?**
   ```bash
   gh pr view --json state,url 2>/dev/null
   ```
   - If a PR exists and is open → "PR <url> is still open. Want to merge it first, or switch anyway?"
   - If no PR exists and there are commits ahead of the default branch → "This branch has unmerged work. Want me to create a PR, or switch anyway?"

Wait for the user's decision before proceeding.

## Step 2 — Parse and Load

1. Parse the issue number from arguments.
2. If no number given, list open issues:
   ```bash
   gh issue list --state open --json number,title,labels --limit 15
   ```
   If no open issues, check `docs/roadmap.md` — suggest starting the next roadmap phase if applicable.
3. Fetch full issue details including comments: `gh issue view <number> --json title,body,labels,comments,state`
4. Read `CONTEXT.md` for **work mode**. Default to **manual** if not specified.
5. Read `WORKFLOW.md` if it exists — this contains the mode-specific rules, question intensity, and TDD setting for this project.
6. `--manual` or `--autonomous` flag overrides the project setting for this session.

## Step 3 — Branch Setup

1. Check if a branch already exists:
   ```bash
   git branch --list "*<number>*"
   ```
2. If it exists, switch to it.
3. If not, create from the default branch:
   - `bug` label → `bug/<number>-<slug>`
   - Otherwise → `feature/<number>-<slug>`
   - Slug: lowercase, hyphenated, max 5 words from the issue title.

## Step 4 — Show Context

```bash
echo -ne "\033]0;#<number> — <title>\007"
```

```
🎯 Working on #<number>: <title>
📋 Mode: <autonomous|manual|guided>
🌿 Branch: <branch-name>

<2-3 sentence summary of what needs doing>
```

## Step 5 — Plan or Implement

Run the `plan-implementation` skill, which handles questions, the brief, and the agent plan.

### Manual Mode

1. Run `plan-implementation`.
2. Present the brief and **stop**. Do not write any code.
3. Wait for explicit approval before beginning implementation.

### Autonomous Mode

1. Run `plan-implementation`.
2. Present the brief. Begin implementation immediately after.
3. Commit after each step.
4. When done, run `/code-review` (quick mode) as a self-check.
5. Create a PR. **Do not merge it.**

### Guided Mode

Same as autonomous, but at the end of an epic (when all issues in the current roadmap phase are complete), **stop and run the epic review** before starting the next phase:

1. Run `/code-review deep` across the epic's changes.
2. Present a summary: what was built, what was deferred, any architectural concerns.
3. Propose the next epic from `docs/roadmap.md`.
4. **Wait for the user to approve** before starting the next epic.

## Scope Discipline During Implementation ⚠️

Any time a decision is made that deviates from the original issue scope — something deferred, added, or changed — post a comment on the GitHub issue immediately:

```bash
gh issue comment <number> --body "Scope decision: [what changed and why]. Follow-up tracked: [issue link or 'none needed']."
```

This keeps the review agent informed and prevents it flagging intentional deferrals as missing work.

## Rules

- **Never close the issue** — only the user can do that.
- **Never merge a PR** — only the user can do that.
- One issue at a time. Run Step 1 checks before switching.
- Update `CONTEXT.md` if any decisions are made during implementation.
- Record new architecture decisions in `docs/decisions/` if applicable.
