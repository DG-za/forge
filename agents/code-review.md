## Code Reviews 🔍

### Scoring System

Rate every PR on four dimensions. Higher is better.

| Score | Emoji | Meaning |
|---|---|---|
| 1–2 | 🔴 | Significant problems — block merge |
| 3–4 | 🟠 | Notable concerns — fix before merge |
| 5–6 | 🟡 | Acceptable with improvements |
| 7–8 | 🟢 | Good — minor suggestions only |
| 9–10 | 💚 | Excellent — no meaningful issues |

#### Dimensions

| Dimension | What it measures |
|---|---|
| **Issue coverage** | How well does the PR address the linked issue's goals and acceptance criteria? |
| **Architecture direction** | Are boundaries, dependencies, and module structure heading the right way? |
| **Readability / maintainability** | Can a developer understand and safely change this code? |
| **Future change resilience** | How easy will it be to extend or modify this code later? |

Present scores in a table:

```markdown
| Dimension | Score |
|---|---|
| Issue coverage | 💚 9 |
| Architecture direction | 🟢 7 |
| Readability / maintainability | 🟡 6 |
| Future change resilience | 🟢 8 |
```

Include a concrete refactor suggestion whenever any score is below 7.

### Review Priority Order

Apply this priority order in every review:

1. **Architecture direction** and boundary quality
2. **Readability** and maintainability
3. **Correctness** issues with meaningful behavioural impact
4. **Test strategy** for decision logic and behaviour changes
5. **Low-priority nits** (max 3 — typos, formatting, style already covered by tooling)

### Code Smells Checklist

Flag any of these when spotted:

- God-classes or monolithic modules
- Deeply nested conditionals or long case statements
- Unnecessary coupling between classes
- Dead code (unused variables, unreachable branches, commented-out code)
- Duplicated logic that should be extracted
- Long functions doing too many things
- Magic numbers/strings without named constants
- Inconsistent abstraction levels within a function
- Mutable shared state modified from multiple places
- Leaky abstractions exposing implementation details
- Shotgun surgery (one logical change scattered across many files)

### Suppression Rules

- **Don't report style enforced by tooling.** If ESLint/Prettier/Ruff already handles it, skip it.
- **Don't request tests for library behaviour.** Only test code that makes decisions.
- **Naming is a readability concern, not a nit.** Bad names are priority issues.
- Treat consistency as a maintainability concern, not cosmetic.

### PR Review Output Contract

When asked to review a PR, produce findings in this order:

1. **Issue goal summary** — 2–4 sentences summarising the linked issue's objective and acceptance criteria.
2. **Scores** — table format (see above).
3. **Architecture verdict** — 3–6 bullets on structure, boundaries, and direction.
4. **Priority issues** — numbered blocks, ordered by implementation priority.
5. **Test strategy gaps** — only for decision logic and behaviour (issue blocks).
6. **Low-priority nits** — optional, max 3 (issue blocks).

#### Issue Block Format

```markdown
### 1. Short issue name — Severity (high/medium/low)

**File:** `path/to/file.ts:42`

Problem description — what's wrong and why it matters.

\`\`\`typescript
// The problematic code
\`\`\`

**Suggested fix:** What to change and why.
```

### Commit Message Conventions

- Short imperative subject line: "Add user auth", not "Added user auth".
- Body (optional): explain **why**, not what. The diff shows what changed.
- Reference the issue number where applicable.
