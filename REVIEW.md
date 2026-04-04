# Code Review Methodology

This file defines how code reviews work in this project. Read it at the start of any review — do not rely on memory of the rules.

---

## Before You Review

1. **Read the linked GitHub issue AND all its comments.**
   Comments record scope decisions, deferrals, and mid-implementation changes. Review against the full picture — not just the original issue body. If a comment says "decided not to implement X", do not flag X as missing.

2. **Read `AGENTS.md`** in the repo root and any `AGENTS.md` in directories touched by the diff.

3. **Fetch the diff** for the target scope (PR, branch, commit, epic, etc.).

---

## What to Check

Every review — regardless of depth — covers these dimensions:

### 1. AGENTS.md Compliance
- File size limits, naming conventions, architecture rules
- Patterns and conventions defined for this project
- Any rules added during this project's development

### 2. Bug Scan
- Logic errors, incorrect return values, broken control flow
- Missing null/undefined checks at system boundaries
- Edge cases the implementation doesn't handle

### 3. Readability
- Unclear naming (variables, functions, files)
- Deep nesting or overly long functions
- Inconsistent patterns with the rest of the codebase

### 4. Domain Health ⚠️ (mandatory — every review, every depth)

Explicitly check across all touched files:

- **Cross-domain dependencies** — did this change introduce imports or calls that cross domain boundaries inappropriately?
- **God class risk** — is any single file now doing more than one thing at a meaningful level?
- **Mixed responsibilities** — any files mixing data access, business logic, and presentation?

Report as one of:
- `**Domain health:** ✅ clean` — no concerns
- `**Domain health:** ⚠️ concerns` — list each concern as a numbered issue (same format, same severity scoring)

Domain health concerns are **not a separate section** — they count as regular issues and are prioritised alongside other findings. A god class is high severity. A minor cross-import is medium.

---

## Confidence Scoring

Score each finding 0–100:

| Score | Meaning |
|---|---|
| 0 | False positive or pre-existing issue |
| 25 | Might be real, uncertain |
| 50 | Real but minor nitpick |
| 75 | Real issue, will likely happen in practice |
| 100 | Confirmed, happens frequently or has high impact |

**Quick depth threshold: discard anything below 75.**
**Default depth threshold: discard anything below 60.**
**Deep depth threshold: discard anything below 50.**

---

## Quick Depth

Single-pass review. Focus on real issues only.

1. Scan the diff for all four dimensions above.
2. Score each finding.
3. Discard anything below 75.
4. Produce output (see Output Formats below).

---

## Default Depth

Single-pass review with broader coverage than quick. Catches more issues, still fast.

1. Scan all four dimensions, including related files that weren't modified but are affected.
2. Score each finding.
3. Discard anything below 60.
4. Produce output.

---

## Deep Depth

Full multi-phase review. Surfaces architectural and systemic issues.

### Phase 1 — Parallel Perspectives

Run these angles simultaneously:

1. **AGENTS.md compliance audit** — check every rule.
2. **Bug scan** — logic errors, edge cases, security issues.
3. **Git history context** — `git log` and `git blame` on touched files to understand intent.
4. **Readability and DRY** — naming, duplication, abstraction levels, function length.
5. **Related file analysis** — files that should have changed but didn't.
6. **Domain health audit** — full cross-domain dependency mapping, god class scan, responsibility mixing across touched files and their neighbours.

### Phase 2 — Confidence Scoring

Score all findings. Discard anything below 50.

### Phase 3 — Deep Review of Survivors

For each finding scoring 50+:

1. Read the **full file** for surrounding context (not just the diff hunk).
2. Compare against the linked issue's acceptance criteria and all scope decisions in comments.
3. Check for missing changes (tests, docs, related modules).

---

## Output Formats

### Scores Table

Always include at the top of the output:

```
| Dimension | Score |
|---|---|
| Issue coverage | 💚 9 |
| Architecture direction | 🟢 8 |
| Readability / maintainability | 🟡 6 |
| Future change resilience | 🟢 7 |
```

5-band emoji scale: 🔴 1–2 · 🟠 3–4 · 🟡 5–6 · 🟢 7–8 · 💚 9–10

### Issue Block Format

```markdown
### N. Short issue name — Severity (high/medium/low) — Confidence: 85

**File:** `path/to/file.ts:42`

Problem description — what's wrong and why it matters in production.

\`\`\`typescript
// The problematic code
\`\`\`

**Suggested fix:** What to change and why.
```

### Quick / Default Output

Post as a PR comment, or print to terminal if no PR:

```
### 🔍 Code Review (quick|default)

**Scores:**
<scores table>

**Domain health:** ✅ clean | ⚠️ concerns

**Issues found: N**

<issue blocks>

---
<artifact note if saved, otherwise: "Run with depth=deep to save a review artifact.">
```

### Deep Output

**1. Artifact** — save to `docs/reviews/<identifier>/review-YYYY-MM-DD.md`:
- Use PR number as identifier if reviewing a PR, branch name otherwise.
- Append `-2`, `-3` etc. if a file already exists for that date.

Artifact sections:
1. **Goal summary** (2–4 sentences — incorporate scope changes from comments)
2. **Scores** (table)
3. **Domain health** (required even if clean)
4. **Architecture verdict** (3–6 bullets)
5. **Priority issues** (numbered issue blocks)
6. **Test strategy gaps** (decision logic and behaviour only)
7. **Low-priority nits** (optional, max 5)

**2. PR comment** (if reviewing a PR) — post via `gh pr comment`:
- List issues with file/line links using full git SHA for permalinks.
- Link to the saved artifact.

---

## False Positives — Do Not Report

- Pre-existing issues not introduced by this change
- Issues caught by linters, type checkers, or compilers
- Code with explicit lint-ignore comments (conscious choice)
- Pedantic nitpicks on lines the author didn't touch
- Library behaviour or object shape concerns
- **Scope items explicitly deferred in issue comments** — if a comment records a decision not to implement something, do not flag it as missing
