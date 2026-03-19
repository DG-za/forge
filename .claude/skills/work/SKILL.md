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
   Check if the current branch has an open PR or unmerged changes:
   ```bash
   gh pr view --json state,url 2>/dev/null
   ```
   - If a PR exists and is open → tell the user: "PR <url> is still open. Want to merge it first, or switch anyway?"
   - If no PR exists and we're not on the default branch and there are commits ahead of the default branch → ask: "This branch has unmerged work. Want me to create a PR, or switch anyway?"

Wait for the user's decision before proceeding. Don't force anything.

## Step 2 — Parse and Load

1. Parse the issue number from arguments.
2. If no number given, list open issues and let the user pick:
   ```bash
   gh issue list --state open --json number,title,labels --limit 15
   ```
   If there are no obvious open issues to work on, check `docs/roadmap.md` — if the current phase is complete or there are no open issues for it, suggest starting the next phase: "No open issues. The roadmap shows Phase X is next. Want me to run `/roadmap` to create issues for it?"
3. Fetch full issue details: `gh issue view <number> --json title,body,labels,state`
4. Read `CONTEXT.md` to determine **work mode** (look for `Work Mode: autonomous` or `Work Mode: manual`). Default to **manual** if not specified.
5. A `--manual` or `--autonomous` flag in the arguments overrides the project setting for this session.

## Step 3 — Branch Setup

1. Check if a branch already exists for this issue:
   ```bash
   git branch --list "*<number>*"
   ```
2. If a branch exists, switch to it.
3. If not, create a new branch from the default branch:
   - Check issue labels for `bug` → use `bug/<number>-<slug>`
   - Otherwise → use `feature/<number>-<slug>`
   - Slug: lowercase, hyphenated, max 5 words from the issue title.
   ```bash
   git checkout -b feature/<number>-<slug>
   ```

## Step 4 — Show Context

Set the terminal tab title and display a brief summary:

```bash
echo -ne "\033]0;#<number> — <title>\007"
```

```
🎯 Working on #<number>: <title>
📋 Mode: <autonomous|manual>
🌿 Branch: <branch-name>

<2-3 sentence summary of what needs doing>
```

## Step 5 — Plan or Implement

### Manual Mode

1. Run the `plan-implementation` skill for this issue.
2. Present the plan and **stop**. Do not write any code.
3. Wait for the user to review and approve the plan.
4. Only after explicit approval ("looks good", "go ahead", "approved", etc.), begin implementation.

### Autonomous Mode

1. Run the `plan-implementation` skill for this issue.
2. Present the plan briefly (3–5 bullet summary).
3. Immediately begin implementation.
4. Commit after each step.
5. When done, run a quick self-review (review current branch diff vs default branch).
6. Create a PR if the work is complete.
7. **Do not merge the PR** — always leave that for the user.

## Rules

- **Never close the issue** — only the user can do that.
- **Never merge a PR** — only the user can do that.
- One issue at a time. If the user calls `/work <other-number>`, run Step 1 checks first.
- Update `CONTEXT.md` if any decisions are made during implementation.
- Record new architecture decisions in `docs/decisions/` if applicable.
