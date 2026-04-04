## General Rules 📐

These rules apply to every project, regardless of stack or size.

### Language and Tone 🗣️

Keep communication **friendly, approachable, and technically precise**. Emojis are welcome in headings, labels, and commit messages — they make things scannable. Write like you're talking to a colleague, not writing a spec. But when the topic is technical, be precise — don't dumb down terminology.

### Issue and PR Safety 🛡️

- **Never close an issue** unless the user explicitly says to close it. Code being complete is not the same as reviewed and approved.
- **Never merge a PR** unless the user explicitly says to merge it.
- Always wait for explicit confirmation before either action.

### No Band-Aids 🩹

Don't recommend a workaround when a proper fix exists. If the proper fix is out of scope, create an issue for it before applying the workaround — and add a comment in the code linking to that issue. Band-aids without tracked follow-ups become permanent.

### Out-of-Scope Issues 🔍

When you spot a problem that's outside the current issue's scope:

- **Small fix** (contained to a single file **or** less than 10 lines total across files) — suggest fixing it in the current branch. Don't ask, just flag it and fix it.
- **Larger fix** (spans multiple files **and** exceeds 10 lines) — create a new GitHub issue automatically with a clear description of the problem and suggested fix. Don't attempt the fix in the current branch.

### Coding Priority Hierarchy

When two approaches conflict, the higher-priority value wins. Spend effort here first.

| Priority | Area | Guidance |
|---|---|---|
| ⭐⭐⭐ | **Readability** | Code is optimised for speed of reading and comprehension. A developer (or AI) should understand what the code does within seconds. Readability outweighs cleverness, premature optimisation, or abstraction. |
| ⭐⭐ | **Simplicity** | Propose the minimum code and architecture needed. Don't build for hypotheticals. Start simple, build so you can expand. |
| ⭐⭐ | **DRY** | If logic appears twice, extract it. Three times is too late. This applies to functions, components, templates, and CSS. |
| ⭐ | **Consistency** | Same patterns everywhere. If you do it one way in file A, do it the same way in file B. Consistency is a maintainability concern, not cosmetic. |
| ⭐ | **Maintainability** | Easy to change later. Low coupling, clear boundaries, no spaghetti. |
| ⭐ | **Architecture** | Clean separation of concerns, sensible module boundaries. Appropriate to the project's scale. |
| ⭐ | **Type safety** | Strong typing, no `any`, interfaces for contracts. Types clarify intent and catch bugs. |
| — | **Testing** | Meaningful tests that catch real bugs. Coverage numbers don't matter. |
| — | **Correctness** | Handle the common path well. Edge cases can be skipped if unlikely in practice. |
| — | **Security** | Add where meaningful (auth, user input). Most apps here are not high-value targets. |
| — | **Error handling** | Add where very meaningful (login, payments). Otherwise, let errors surface naturally. |
| — | **Performance** | Almost never a concern. Don't optimise unless there's a measured problem. |

### Documentation Maintenance 📝

When code changes affect behaviour, update relevant docs in the same PR:

- **Changed feature?** Check its docs and update them.
- **New feature?** Add at minimum a README entry.
- **Removed feature?** Clean up its docs.
- **Changed commands or setup steps?** Update README.

Don't let docs drift from reality. But code should be self-documenting — comments explain **why**, not **how**. If a function needs a comment explaining how it works, the function is too complex.

Document **decisions** so they don't get relitigated. Decision docs improve the development process over time.

### File Size and Abstraction Limits 📏

The line count itself is not the rule — **single-purpose and single-level-of-abstraction** is the rule. LOC is a useful signal, not the goal.

**Why files get too long:** A file over ~150 lines is usually doing multiple things, or mixing responsibilities at different levels of abstraction. Low-level code and high-level code should not live in the same file. A class that orchestrates a workflow should not also contain the utility logic it calls.

**The real test:** Can you describe what this file does in one sentence without using "and"? If not, split it — regardless of line count.

| File type | Target | Soft max | Notes |
|---|---|---|---|
| Sequential logic (most files) | 100 lines | 150 lines | Files where you read top-to-bottom to understand the logic |
| Collections (CRUD services, utility helpers) | 100 lines | 300 lines | Files where each function is independent — readers jump to a specific function |
| Test files | No limit | — | Tests are exempt |

- A file **under** 150 lines that mixes abstraction levels or has multiple responsibilities **still needs refactoring**.
- A file **over** 150 lines that has a single purpose and single level of abstraction **can be justified** — but you must be able to explain why it can't be split.

### Naming Conventions 🏷️

- **Variables** describe what they hold. **Functions** describe what they do.
- **Booleans** read as questions: `isActive`, `hasPermission`, `canEdit`.
- **Files:** lowercase with hyphens (`user-service.ts`, `auth-guard.ts`).
- **Classes/components:** PascalCase (`UserService`, `AuthGuard`).
- **Variables/functions:** camelCase (`getUserById`, `activeUsers`).
- No abbreviations except universally understood ones (`id`, `url`, `config`, `db`).
- **Naming is a readability concern, not a nit.** If a name doesn't communicate what it does, fix it.

### Code Style ✍️

- **Flat over nested.** Max 2–3 levels of nesting. Use early returns and guard clauses.
  - Prefer `if (!valid) return;` over wrapping the body in `if (valid) { ... }`.
  - Use early returns to reduce indentation and improve flow.
- **`else if` for mutually exclusive conditions**, even when branches return.
- **Prefer declarative collection operations** over imperative loops (`map`, `filter`, `reduce` in JS/TS; list comprehensions in Python).
- **Optimise for brevity when it doesn't harm understanding:**
  - Object shorthand (`{ id, name }` not `{ id: id, name: name }`)
  - Spreading to condense parameters
  - Omit braces for single-line conditionals when clear
- **Functions under 20 lines preferred.** Long functions are harder to understand.

### Commit Conventions 🔀

- **Commit and push after every significant change.** Multiple machines need access to the latest code.
- Short imperative commit messages: "Add user auth", not "Added user auth" or "This commit adds user auth".
- Run linting and formatting before committing. Fix all errors.
- Don't suppress lint rules without a justifying comment.

### AGENTS.md vs PROJECT.md 📂

- **`AGENTS.md`** contains standard rules generated from templates. It can be regenerated or updated by `/scaffold` at any time. **Do not add project-specific rules here** — they will be overwritten.
- **`PROJECT.md`** contains project-specific rules, patterns, and conventions that evolved during development. This file takes precedence over `AGENTS.md` when they conflict.
- When you discover a new convention or rule specific to this project, add it to `PROJECT.md`, not `AGENTS.md`.

### Memory and Context 🧠

Do **not** use the auto-memory system (`~/.claude/projects/.../memory/`). Persist all learnings, decisions, and preferences to `CONTEXT.md` in the repo root. This keeps context version-controlled and available across all machines.

**Auto-update CONTEXT.md** when any of these happen during a session:
- A technical decision is made (e.g. "we'll use stores instead of context for state")
- A new pattern is established (e.g. "all API calls go through the api.ts wrapper")
- The stack changes (new dependency, removed library)
- A preference or convention is agreed on

Keep CONTEXT.md concise — it's a reference, not a journal.

### Architecture Decisions 📋

Record significant architecture decisions in `docs/decisions/` using short markdown files. Name them `NNN-short-description.md` (e.g. `001-use-prisma-over-typeorm.md`).

Before proposing a change that contradicts a recorded decision, **read the decision doc first** and flag the conflict. Decisions can be revisited, but not silently overridden.

### Git Branching 🌿

- All work happens on a feature or bug branch — never commit directly to the default branch.
- Branch naming: `feature/<issue-number>-<description>` or `bug/<issue-number>-<description>`.
- One issue per branch. Don't mix unrelated changes.

### Imports 📦

- Use path aliases (`@/`) for internal imports where the project supports them.
- Never use relative paths that go up more than one level (`../../`).
- Group imports: external libraries → internal modules → relative files.
