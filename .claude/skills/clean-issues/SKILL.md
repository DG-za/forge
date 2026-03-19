---
name: clean-issues
description: Audit open GitHub issues — stale, duplicate, outdated, or mislabelled issues
user_invocable: true
---

# Clean Issues 📋

Audit all open GitHub issues for the current repository. Identify stale issues, duplicates, issues that no longer make sense, and labelling problems.

## Step 1 — Fetch Issues

```bash
gh issue list --state open --json number,title,body,labels,createdAt,updatedAt,comments --limit 100
```

Also fetch closed issues from the last 30 days for duplicate/overlap detection:
```bash
gh issue list --state closed --json number,title,body,labels,closedAt --limit 50
```

## Step 2 — Analyse Each Issue

For each open issue, check:

### Staleness
- **No activity in 30+ days** and no `idea` label → flag as potentially stale.
- **No activity in 90+ days** → flag as likely stale, recommend closing or converting to idea.
- Ideas are exempt from staleness — they can sit indefinitely.

### Relevance
- Read the issue body and compare against the current codebase.
- **References removed files or features?** → flag as outdated.
- **Goal already achieved by other work?** → flag as potentially complete.
- **Blocked by something that's no longer relevant?** → flag for review.

### Duplicates and Overlap
- Compare issue titles and bodies for semantic similarity.
- Flag issues that cover the same ground — suggest which to keep and which to close.
- Check if any open issues overlap with recently closed ones.

### Labels
- **Missing domain label?** → flag (every issue needs at least one).
- **Has `idea` label but also has sub-issues or is assigned?** → might need to be promoted to a real task.
- **Has `ai-task` label but requires human input?** → flag for review.
- **Epic with all sub-issues closed but epic still open?** → flag for closing.

### Orphans
- **Sub-issues whose parent epic is closed** → flag.
- **Issues referencing a parent epic that doesn't exist** → flag.

## Step 3 — Report

Group findings by type:

```
📋 Clean Issues: <N> open issues analysed

🕐 Stale (no activity 30+ days):
  - #12 — <title> (last activity: YYYY-MM-DD)
  - #15 — <title> (last activity: YYYY-MM-DD)

🗑️ Likely outdated:
  - #8 — <title> — references removed feature X
  - #11 — <title> — goal achieved in PR #23

🔄 Potential duplicates:
  - #5 and #19 overlap — both cover <topic>

🏷️ Label issues:
  - #7 — missing domain label
  - #14 — has `idea` label but has sub-issues (promote?)

👻 Orphans:
  - #22 — parent epic #3 is closed
```

For each finding, include a recommended action: close, merge, relabel, or review.

## Rules

- **Never close issues automatically.** Flag only — the user decides.
- **Never remove labels automatically.** Suggest changes only.
- Be conservative — only flag issues you're confident about. When in doubt, skip.
- Issues with the `idea` label are allowed to be old and vague — don't flag them for staleness.
