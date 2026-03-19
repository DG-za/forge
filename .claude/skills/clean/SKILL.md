---
name: clean
description: Run all clean skills in sequence — code, architecture, repo, and issues
user_invocable: true
---

# Clean Everything 🧹

Run all four clean skills in sequence to get a full health check of the project.

## Process

Run these in order:

1. **`/clean-code`** — scan changed files against code cleanliness rules
2. **`/clean-architecture`** — check module boundaries and dependency direction
3. **`/clean-repo`** — audit repo structure, docs, and file hygiene
4. **`/clean-issues`** — audit open GitHub issues for staleness, duplicates, and drift

## Output

After all four complete, print a summary:

```
🧹 Clean sweep complete

  Code:         X issues (Y auto-fixed)
  Architecture: X issues
  Repo:         X issues
  Issues:       X issues flagged

  Total: X items need attention
```

## Rules

- Do not auto-close issues — flag only.
- Small code fixes (single file or < 10 lines) can be auto-fixed. Flag everything else.
- Create new GitHub issues for larger problems found during the sweep.
