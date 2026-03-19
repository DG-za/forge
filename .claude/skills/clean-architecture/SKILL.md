---
name: clean-architecture
description: Check module boundaries, dependency direction, and structural integrity against architecture rules
user_invocable: true
---

# Clean Architecture 🏛️

Check the project's structure against its architecture rules. Verify module boundaries, dependency direction, file organisation, and domain ownership.

## Step 1 — Load Architecture Context

1. Read `AGENTS.md` — find the **Architecture** section to determine the tier (small/medium/large) and its rules.
2. Read `PROJECT.md` — check for project-specific architectural rules or overrides.
3. Read `docs/architecture.md` if it exists — this is the cached architecture map showing module classification, domain boundaries, and key dependencies.

## Step 2 — Discover Current State

Scan the project's source files to build a picture of the current architecture:

- **Module inventory:** List all top-level folders/modules in the source directory.
- **Import graph:** For each module, trace what it imports from other modules.
- **File sizes:** Flag files exceeding the size limits.
- **Domain boundaries:** Identify which modules own which data types and operations.

## Step 3 — Check Against Rules

Based on the architecture tier:

### Small projects (< 1k LOC)
- No god-files (3+ unrelated concepts in one file)?
- Each concept owns its own data and logic?
- Flat structure — no unnecessary nesting?

### Medium projects (1k–50k LOC)
- Module boundaries by domain concept?
- Domains own their data — no cross-domain data access?
- No circular imports?
- Modules not reaching into each other's internals?
- Folder depth ≤ 3 levels?
- Shared types in a common location (not duplicated)?

### Large projects (50k+ LOC)
- All medium rules, plus:
- Module classification correct (domain/infrastructure/utility/integration)?
- R1: No domain-to-domain imports?
- R2: Infrastructure modules are leaves?
- R3: Utility modules are leaves?
- R4: No circular imports?
- Layered architecture (controllers → services → repositories)?

## Step 4 — Update Architecture Cache

If `docs/architecture.md` doesn't exist, create it. If it exists, update it with the current state.

Format:

```markdown
# Architecture Map

**Tier:** <small | medium | large>
**Last updated:** <YYYY-MM-DD>

## Modules

| Module | Responsibility | Type | Key dependencies |
|---|---|---|---|
| auth/ | Authentication and session management | domain | config |
| users/ | User data and operations | domain | auth |
| shared/ | Shared types and utilities | utility | — |

## Domain Boundaries

- `auth` owns: session tokens, login flow, permissions
- `users` owns: user profiles, preferences

## Key Dependency Directions

- Routes → Services → Data access
- All modules may import from `shared/`

## Known Violations

- <any current violations noted here>
```

## Step 5 — Report

For each violation found:

```
⚠️ Architecture: <violation type>
   <module/file> — <description>
   Rule: <which rule is violated>
   Suggested fix: <brief suggestion>
```

### Summary

```
🏛️ Clean Architecture: <N> modules analysed

  ✅ Clean:     X modules
  ⚠️  Violations: X issues
  📋 Issues created: X (for significant problems)

  Module health:
  - <module>: ✅
  - <module>: ⚠️ <brief issue>
```

## Rules

- Small issues (e.g. one misplaced import) — flag and suggest a fix.
- Larger issues (e.g. circular dependency between modules, god-file) — create a GitHub issue.
- Always update `docs/architecture.md` after running, even if no violations found.
- The architecture cache should be committed (it's useful context, not an ephemeral artifact).
