---
name: idea
description: Capture an early-stage idea as a GitHub issue with the idea label
user_invocable: true
---

# Capture Idea 💡

Capture an early-stage idea as a GitHub issue on this repo.

## Input

$ARGUMENTS

## Process

1. **Gather the idea.** If the user hasn't described it yet, ask: "What's the idea?"
2. **Summarise** the idea back to the user in 2–3 sentences. Ask: "Does that capture it? Anything to add?"
3. **Create the issue** with the `idea` label.

## Issue Format

```markdown
## 💡 Idea

<2–5 sentence summary of the idea>

## Context

<Why this came up, what problem it solves, any relevant background>

## Open Questions

- <3+ questions to guide future brainstorming>
- <Think about scope, feasibility, and dependencies>
- <What would need to be true for this to work?>

## Status

💡 Idea — needs exploration
```

## Rules

- Always add the `idea` label. If it doesn't exist on the repo, create it (`gh label create idea --color "fbca04" --description "Early-stage idea — not yet fleshed out"`).
- Link to a parent epic if one is obviously relevant.
- Don't over-structure — ideas should be lightweight.
- Confirm with the user before creating.
- Echo the result:
  ```bash
  echo -e "\033[38;5;214m📋 #<number> <title> [created]\033[0m"
  ```
