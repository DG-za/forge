---
name: clean-repo
description: Audit repo structure — file hygiene, docs freshness, naming, dead files
user_invocable: true
---

# Clean Repo 📁

Audit the repository's structure, documentation, and file hygiene. Identify things that have drifted, gone stale, or need attention.

## Step 1 — File Hygiene

Check for:

- **Files exceeding size limits** — per AGENTS.md file size rules.
- **Naming violations** — files not following the project's naming convention (kebab-case, type suffixes, etc.).
- **Dead files** — source files not imported by anything, orphaned tests, unused configs.
- **Empty files** — files with no meaningful content.
- **Temporary files** — files that look like they were left behind (`.bak`, `.old`, `.tmp`, `copy-of-*`).

## Step 2 — Documentation Freshness

Check these files against the actual codebase:

- **README.md** — are the setup instructions, common commands, and project description still accurate? Does it reference files/features that don't exist?
- **CONTEXT.md** — does the stack description match `package.json` / `requirements.txt`? Are decisions still relevant?
- **PROJECT.md** — do the project-specific rules reference files or patterns that still exist?
- **docs/decisions/** — any decisions that reference removed code or superseded patterns?

## Step 3 — Structure Check

- **Folder depth** — flag anything nested deeper than the architecture tier allows.
- **Misplaced files** — files in the wrong folder (e.g. a utility in a domain folder, a type file in the root).
- **Missing standard files** — check that the scaffolded files all exist: AGENTS.md, PROJECT.md, CLAUDE.md, CONTEXT.md, .editorconfig, .gitignore.

## Step 4 — Config Freshness

- **Dependencies** — are there packages in `package.json` / `requirements.txt` that aren't imported anywhere?
- **Environment variables** — does `.env.example` (if it exists) match what the code actually reads?
- **Linting config** — does the ESLint/Prettier/Ruff config match what AGENTS.md prescribes?

## Step 5 — Report

For each issue found:

```
⚠️ Repo: <issue type>
   <file/folder> — <description>
   Suggested fix: <brief suggestion>
```

Categorise issues:

- **🗑️ Remove** — dead files, empty files, temp files
- **📝 Update** — stale docs, outdated descriptions
- **📁 Move** — misplaced files
- **➕ Add** — missing standard files

### Summary

```
📁 Clean Repo: <N> files checked

  🗑️ Remove:  X items
  📝 Update:  X items
  📁 Move:    X items
  ➕ Add:     X items
```

## Rules

- Do **not** delete files automatically — flag them for the user.
- Small doc fixes (updating a command, fixing a broken link) — apply directly.
- Larger doc rewrites — flag and describe what needs updating.
- If README.md is significantly out of date, offer to regenerate it.
