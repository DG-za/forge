---
name: review-pr
description: Review a PR (or branch diff) — quick scan by default, --deep for thorough multi-phase review
user_invocable: true
argument-hint: [PR-number] [--deep]
---

# Review Code Changes

Review a pull request or the current branch's changes against the default branch.

## Input

$ARGUMENTS

## Setup

1. Parse arguments:
   - If a PR number is given, use it.
   - If `--deep` is passed, use deep mode. Otherwise, use quick mode.
2. **Detect what to review:**
   - If a PR number was given → fetch the PR diff.
   - If no PR number → check if a PR exists for the current branch (`gh pr view --json number` from current branch). If yes, use that PR.
   - If no PR exists → review the diff between the current branch and the default branch (`git diff main...HEAD` or `git diff develop...HEAD`).
3. Fetch the linked GitHub issue (if any) to understand the goal.
4. Read `AGENTS.md` in the repo root and any `AGENTS.md` in touched directories.

## Quick Mode (default)

Single-pass review. Fast, focused on real issues.

### Review

Scan the diff for:
- **AGENTS.md violations** — file size limits, naming, architecture rules, conventions.
- **Bug scan** — logic errors, missing null checks, broken control flow, incorrect return values.
- **Readability concerns** — unclear naming, deep nesting, long functions, inconsistent patterns.

### Confidence Scoring

Score each finding 0–100:

| Score | Meaning |
|---|---|
| 0 | False positive or pre-existing issue |
| 25 | Might be real, uncertain |
| 50 | Real but minor nitpick |
| 75 | Real issue, will likely happen in practice |
| 100 | Confirmed, happens frequently or has high impact |

**Quick mode threshold: discard anything below 75.**

### Output

Post a PR comment (or print to terminal if no PR):

```
### 🔍 Code Review (quick)

**Scores:**

| Dimension | Score |
|---|---|
| Issue coverage | 💚 9 |
| Architecture direction | 🟢 8 |
| Readability / maintainability | 🟡 6 |
| Future change resilience | 🟢 7 |

**Issues found: N**

1. **Issue name** — severity
   `file.ts:42` — description and why it matters.
   Suggested fix.

---
No artifact saved. Run with `--deep` for a full review.
```

If no issues found: "✅ No issues found. Checked for bugs, AGENTS.md compliance, and readability."

## Deep Mode (`--deep`)

Full multi-phase review with lower threshold. Surfaces more issues.

### Phase 1: Parallel Multi-Perspective Review

Run these review angles in parallel:

1. **AGENTS.md compliance audit** — check every rule in the project's AGENTS.md.
2. **Bug scan** — logic errors, edge cases, security issues.
3. **Git history context** — `git log` and `git blame` on touched files to understand intent.
4. **Readability and DRY** — naming, duplication, abstraction levels, function length.
5. **Related file analysis** — are there files that should have been changed but weren't?

### Phase 2: Confidence Scoring and Filtering

Score each finding 0–100 (same scale as quick mode).

**Deep mode threshold: discard anything below 50.**

### Phase 3: Deep Review of Surviving Issues

For each issue scoring 50+:

1. Read the **full file** for surrounding context (not just the diff hunk).
2. Compare against the linked issue's acceptance criteria.
3. Check for missing changes (tests, docs, related modules).

### Output

**1. Review artifact** — save to `docs/reviews/<identifier>/review-YYYY-MM-DD.md`:
- Use PR number as identifier if reviewing a PR, or branch name if not.
- If file already exists, append `-2`, `-3`, etc.

Sections:
1. **Issue goal summary** (2–4 sentences)
2. **Scores** (table with 5-band emoji: 🔴 1–2, 🟠 3–4, 🟡 5–6, 🟢 7–8, 💚 9–10)
3. **Architecture verdict** (3–6 bullets)
4. **Priority issues** (numbered blocks — see format below)
5. **Test strategy gaps** (decision logic and behaviour only)
6. **Low-priority nits** (optional, max 5)

**2. PR comment** (if reviewing a PR) — post via `gh pr comment`:
- List issues found with file/line links (use full git SHA for permalink).
- Link to the saved review artifact.

### Issue Block Format

```markdown
### 1. Short issue name — Severity (high/medium/low) — Confidence: 85

**File:** `path/to/file.ts:42`

Problem description — what's wrong and why it matters in production.

\`\`\`typescript
// The problematic code
\`\`\`

**Suggested fix:** What to change and why.
```

## False Positives to Ignore

Do not report:
- Pre-existing issues not introduced by this change.
- Issues caught by linters, type checkers, or compilers.
- Code with explicit lint ignore comments (author made a conscious choice).
- Pedantic nitpicks on lines the author didn't modify.
- Library behaviour or object shape concerns.

## Rules

- Reference exact file paths and line numbers.
- Do **not** make any code changes — review only.
- Run the project's lint/check commands before finalising (if available).
- State why each issue matters — don't just say "this is wrong".
- Naming is a **readability concern**, not a nit.
