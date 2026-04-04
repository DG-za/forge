---
name: code-review
description: Full-featured code review — natural language args, opt-in fix/comment/focus, always runs in new window
user_invocable: true
argument-hint: e.g. "quick pr fix", "deep commit suggest", "epic multi-comment issue-12", "architecture correctness"
---

# Code Review 🔍

Run a code review with flexible scope, depth, and output options. All review methodology is defined in `REVIEW.md` — read that file before starting.

## Input

$ARGUMENTS

---

## Step 1 — Parse Arguments

Parse the input as natural language keywords. Order doesn't matter.

### Depth
| Keyword(s) | depth |
|---|---|
| `quick`, `fast` | quick |
| `deep`, `full`, `thorough` | deep |
| _(nothing)_ | default |

### Scope
| Keyword(s) | scope |
|---|---|
| `pr`, `pr-N`, or bare number `N` | pr (target PR N, or auto-detect) |
| `commit`, `commit-<hash>` | commit |
| `epic` | epic (all changes across current epic's issues) |
| `branch`, `branch-<name>` | branch |
| `repo` | repo (full audit) |
| _(nothing)_ | auto (PR if one exists, else current branch diff) |

### Opt-in flags — absent means "don't do this"
| Keyword(s) | Meaning | Default when keyword present |
|---|---|---|
| `fix` | Apply fixes after review | apply |
| `suggest` | Suggest fixes without applying | (sets fix=suggest) |
| `comment`, `multi-comment` | Post inline PR review comments | multi |
| `single-comment` | Post a single summary PR comment | (sets comment=single) |
| `no-comment` | Suppress all comments | (sets comment=none) |
| `architecture`, `arch` | Focus on architecture | added to focus list |
| `readability` | Focus on readability | added to focus list |
| `correctness` | Focus on correctness | added to focus list |
| `rules` | Focus on AGENTS.md compliance | added to focus list |
| `"quoted text"` | Free-text focus instruction | used verbatim |

### Issue context
| Keyword(s) | Meaning |
|---|---|
| `issue-N` | Load issue #N and all its comments for context |
| _(nothing)_ | Infer issue from branch name, or skip if not inferable |

### Defaults summary
- **depth:** default (single pass, threshold 60)
- **scope:** auto-detect
- **fix:** off — not applied unless you opt in
- **comment:** off — not posted unless you opt in
- **focus:** balanced — all dimensions equally weighted

### Examples
```
/code-review                                -> default depth, auto scope, no fix, no comment
/code-review quick pr                       -> quick review of current PR
/code-review deep fix issue-12              -> deep review, apply fixes, load issue #12 context
/code-review full commit fix suggest        -> deep review of last commit, suggest fixes (not apply)
/code-review epic multi-comment issue-12    -> default depth, epic scope, inline PR comments
/code-review "auth logic and edge cases"    -> focus on auth, default depth
/code-review architecture correctness       -> focus on arch + correctness
```

---

## Step 2 — Load Context

1. **Read `REVIEW.md`** — the review methodology. Do not start until you've read this.
2. **Read `AGENTS.md`** in the repo root and touched directories.
3. **Fetch the diff** based on resolved scope:
   - `pr` -> `gh pr view <N> --json files,additions,deletions` + `gh pr diff <N>`
   - `commit` -> `git show <hash>` (default to HEAD if no hash given)
   - `epic` -> get all PRs/issues in the current epic, collect their diffs
   - `branch` -> `git diff <base>...<branch>`
   - `auto` -> check for open PR first (`gh pr view --json number`), else `git diff main...HEAD`
   - `repo` -> read all source files (warn: expensive, confirm before proceeding)
4. **Fetch issue context** (if issue number resolved):
   ```bash
   gh issue view <N> --json title,body,comments
   ```
   Read every comment -- they contain scope decisions and deferrals.
5. **Apply focus** — if focus keywords or text were given, note them. They bias the review but don't replace the full scope.

---

## Step 3 — Launch Review in a New Terminal Window

> **⚠️ MANDATORY: Code reviews ALWAYS run in a new terminal window.**
> Do NOT run the review in the current conversation. Your job is to prepare and launch — nothing more.
> After the new terminal opens, you are DONE. Do not proceed to any further steps.
>
> **🚫 Do NOT skip this step.** Not for small diffs, not for simple changes, not because you already
> have context from implementing the feature. That prior context is exactly the bias this rule prevents.
> If you find yourself thinking "this is small enough to review inline" — that's the signal to follow
> the rule, not skip it.

This prevents prior conversation context from influencing the review findings.

### How to launch

**Do not** pass the prompt as a CLI argument or pipe it via stdin — both fail on Windows for large prompts (argument length limit, stdin hang).

Instead:

1. Read `REVIEW.md` and `AGENTS.md` using the Read tool.
2. Use the **Write tool** to create the context file with the actual file contents embedded — do not use a bash heredoc, as placeholders inside heredocs are written literally and never substituted.
3. Write a minimal launcher script.
4. Open a new Windows Terminal tab running the launcher.

**Step 1 — Clean up old review launch files:**
```bash
rm -f .claude/claude-prompt-review-*.md .claude/launch-review-*.ps1
```

**Step 2 — Write the context file using the Write tool** (not a heredoc):

The file should contain:
```
# Code Review Context

Repo: <owner/repo>
Scope: <scope description>
Target: <PR number / branch / commit / epic>
Issue context: #<N> (if provided, else "none")
Focus: <focus instructions or "balanced">
Fix mode: <apply | suggest | none>
Comment mode: <multi | single | none>
Depth: <quick | default | deep>

## REVIEW.md
<actual contents of REVIEW.md -- read with Read tool and paste here>

## AGENTS.md
<actual contents of AGENTS.md -- read with Read tool and paste here>

## Diff
<full diff>

## Issue #N + Comments
<issue body and all comments, if loaded>

---

## Instructions for the Review Agent

Follow `REVIEW.md` for the selected depth. Apply focus weighting if specified. Then produce output per the format in `REVIEW.md`.

### Fix mode
- `fix=none` -- review only, no changes
- `fix=suggest` -- append a diff/patch block to the artifact showing suggested changes. Do not write files.
- `fix=apply` -- after the review is complete and the artifact is saved, apply the fixes. Commit with message: `fix: apply code-review suggestions (<scope> <date>)`

### Comment mode
- `comment=none` -- no PR comment (default if no PR or not opted in)
- `comment=single` -- post one summary comment on the PR
- `comment=multi` -- post inline review comments on the PR using `gh pr review --comment`
```

Write this to `.claude/claude-prompt-review-<id>.md`.

**Step 3 — Write the launcher** (ASCII only -- no em-dashes, smart quotes, or special chars):
```bash
cat > ".claude/launch-review-<id>.ps1" << 'LAUNCHEOF'
Remove-Item Env:CLAUDECODE -ErrorAction SilentlyContinue
Set-Location "<repo-path>"
claude "You are conducting a code review. Read the file .claude\claude-prompt-review-<id>.md for full context and instructions, then begin the review."
LAUNCHEOF
```

**Step 4 — Open new WT tab:**
```bash
wt new-tab --title "Review <scope> <target>" --suppressApplicationTitle -d "<repo-path>" -- powershell.exe -NoExit -File "<repo-path>\.claude\launch-review-<id>.ps1"
```

**Important:**
- Use `<id>` = timestamp (e.g. `20260329-1430`) or scope identifier to avoid file collisions.
- The launcher message must be **ASCII only** -- no em-dashes, no smart quotes, no special Unicode. Encoding corruption will truncate the prompt.
- Always use the **Write tool** for the context file so embedded content is real, not placeholder text.

Confirm to the user:
```bash
echo -e "\033[38;5;82m Review launched in new window -- <scope> <target>\033[0m"
```

> **🛑 STOP HERE. Your job is done.**
> The review itself runs in the new terminal window. Do not run Steps 4 or 5 below — they exist only as reference for what the new agent will do. Do not summarise the review, do not read the diff yourself, do not produce findings. Just confirm the launch and stop.

---

## Step 4 — Run the Review _(executed by the new terminal agent, not you)_

Follow `REVIEW.md` for the selected depth. Apply focus weighting if specified.

---

## Step 5 — Output _(executed by the new terminal agent, not you)_

Follow the output format in `REVIEW.md`.

---

## Rules

- **Read `REVIEW.md` before starting.** Do not invent review methodology.
- Do **not** make code changes unless `fix=apply` was explicitly requested.
- Reference exact file paths and line numbers.
- Always explain why each issue matters — not just "this is wrong".
- Run lint/check commands before finalising if available.
- Naming is a readability concern, not a nit.
