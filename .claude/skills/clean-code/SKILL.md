---
name: clean-code
description: Scan code against cleanliness rules — flag violations, auto-fix small ones, create issues for larger ones
user_invocable: true
argument-hint: [--all]
---

# Clean Code 🧹

Scan source files against the code cleanliness rules in AGENTS.md. Flag violations, auto-fix small ones, and create issues for larger ones.

## Input

$ARGUMENTS

## Step 1 — Determine Scope

- **Default:** Scan files changed since the last commit (`git diff --name-only HEAD` + untracked files).
- **`--all` flag:** Scan all source files in the project (excluding node_modules, dist, build, .next, __pycache__, etc.).

## Step 2 — Load Rules

1. Read `AGENTS.md` — extract the **Code Cleanliness** section (all numbered rules).
2. Read `PROJECT.md` — check for any project-specific overrides or additional rules.
3. PROJECT.md rules take precedence over AGENTS.md rules.

## Step 3 — Scan

For each file in scope:

1. Read the file content.
2. Check against each applicable rule from the code cleanliness section.
3. Score each violation:
   - **Auto-fixable** — single file, < 10 lines to change (e.g. rename a variable, extract a constant, remove dead code)
   - **Flaggable** — needs human decision or spans multiple files

Focus on rules that are **objectively checkable**, not subjective. Prioritise:
- Function length and parameter count (rules 1, 7, 8)
- Boolean flag parameters (rule 2)
- Naming violations (rules 9–17)
- Dead code and commented-out code (rule 31)
- Side effects in query functions (rule 5)
- Type safety (`any` usage) (rule 37)
- Missing guard clauses (rule 7)

## Step 4 — Fix and Report

### Auto-fix (small issues)

Apply fixes directly. For each fix:
```
✅ Fixed: <rule number> — <brief description>
   <file>:<line> — <what changed>
```

### Flag (larger issues)

For each flagged issue:
```
⚠️ Rule <number>: <rule name>
   <file>:<line> — <description of the violation>
   Suggested fix: <brief suggestion>
```

### Create issues (significant problems)

If a violation is systemic (appears in 3+ files) or requires architectural changes, create a GitHub issue:
- Title: "Code cleanliness: <brief description>"
- Body: list of affected files, the rule violated, and suggested approach
- Labels: `ai-task` (if auto-fixable by AI in a follow-up)

## Step 5 — Summary

```
🧹 Clean Code: <N> files scanned

  ✅ Auto-fixed:    X issues
  ⚠️  Flagged:       X issues
  📋 Issues created: X issues

  Top violations:
  1. Rule <N> (<name>) — X occurrences
  2. Rule <N> (<name>) — X occurrences
  3. Rule <N> (<name>) — X occurrences
```

## Rules

- Do **not** reformat code that the linter/formatter handles (Prettier, ESLint, Ruff). Only check rules that tooling doesn't cover.
- Do **not** flag pre-existing violations when running on changed files only — focus on what was recently touched.
- When running `--all`, flag everything regardless of age.
