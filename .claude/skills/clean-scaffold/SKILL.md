---
name: clean-scaffold
description: Update scaffolded files and skills to the latest versions from second-brain templates
user_invocable: true
---

# Clean Scaffold 🔄

Update this project's scaffolded files and skills with the latest versions from the second-brain template library.

## Step 1 — Identify What Needs Updating

1. Read the template source directory: `C:\Programming\second-brain\setup\agent-templates\`
2. Compare each scaffolded file against its template source:

### Skills (always update)

Compare each skill in `.claude/skills/` against the templates in `setup/agent-templates/skills/`. Skills are standard and should match the latest templates.

List skills that are:
- **Outdated** — content differs from the template
- **Missing** — template exists but skill doesn't
- **Extra** — skill exists but no template (these are project-specific, keep them)

### AGENTS.md (regenerate)

Compare the current `AGENTS.md` against what would be generated from the current templates. Check if:
- New rules have been added to template fragments
- Existing rules have been updated
- New template fragments are available

### Config files (check for drift)

Compare:
- `.prettierrc` against the template
- `eslint.config.*` against the template
- `tsconfig.json` against the template (base settings only — project-specific overrides should be preserved)
- `.editorconfig` against the template

### Standard files (check for missing)

Check if these exist:
- `PROJECT.md`
- `.github/ISSUE_TEMPLATE/work-item.yml`
- `.github/pull_request_template.md`
- `docs/decisions/README.md`

## Step 2 — Show Diff Summary

Present a summary of what would change:

```
🔄 Scaffold update for <project-name>

Skills:
  ✅ Up to date: /review-pr, /plan-implementation, /view
  🔄 Outdated:   /work (Step 1 checks added), /clean-code (new rules)
  ➕ Missing:    /clean-scaffold

AGENTS.md:
  🔄 3 sections changed (code-cleanliness: 30→48 rules, general: new out-of-scope rule, ...)

Configs:
  ✅ Up to date: .prettierrc, eslint.config.mjs
  🔄 Changed: .editorconfig (Python indent rule added)

Files:
  ➕ Missing: PROJECT.md

Proceed? (y/n)
```

## Step 3 — Apply Updates

After the user confirms:

1. **Update skills** — copy latest versions from templates, preserving any project-specific skills.
2. **Regenerate AGENTS.md** — re-read template fragments and assemble. Preserve the project-specific header (Project Overview, Common Commands, Directory Structure, Git Workflow).
3. **Update configs** — only update settings that match the template defaults. Don't overwrite project-specific customisations.
4. **Add missing files** — create any standard files that don't exist yet.
5. **Do NOT touch PROJECT.md, CONTEXT.md, or CLAUDE.md** — these are project-specific.

## Step 4 — Commit

```bash
git add -A
git commit -m "Update scaffold to latest templates — <brief summary of changes>

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push
```

## Step 5 — Summary

```
🔄 Scaffold updated

  Skills:  X updated, X added
  AGENTS:  X sections refreshed
  Configs: X updated
  Files:   X added

  PROJECT.md, CONTEXT.md, CLAUDE.md — untouched ✅
```

## Rules

- **Never modify PROJECT.md** — that's the project's own rules.
- **Never modify CONTEXT.md** — that's the project's state.
- **Preserve the AGENTS.md header** — the Project Overview, Common Commands, Directory Structure, and Git Workflow sections are bespoke.
- **Preserve project-specific skills** — only update skills that have a matching template. Don't delete custom skills.
- **Preserve config customisations** — if a config file has project-specific additions (e.g. extra ESLint rules), merge rather than overwrite.
- **Always show the diff summary and confirm** before applying changes.
