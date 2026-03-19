---
name: view
description: Open an issue or PR in the browser
user_invocable: true
argument-hint: [number]
---

# View in Browser 🌐

Open a GitHub issue or PR in the default browser.

## Input

$ARGUMENTS

## Process

1. Parse the number from arguments.
2. If no number given, infer from the current git branch name (e.g. `feature/12-description` → `12`).
3. If still no number, ask the user.
4. Open in browser: `gh issue view <number> --web` (this works for both issues and PRs).

## Rules

- If the number doesn't match an issue, try `gh pr view <number> --web`.
- No output needed beyond the browser opening. Keep it silent.
