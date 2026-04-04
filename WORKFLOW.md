# Workflow: Manual

## Philosophy

Every decision is deliberate. The AI proposes; you approve. Nothing is built without explicit sign-off. Best for production apps, client work, or any project where correctness and traceability matter more than speed.

---

## Roadmap & Epic Planning

- Full discovery discussion before phases are proposed
- Each phase discussed individually — not approved as a set
- Phases added to the roadmap one at a time after approval

**Question intensity at roadmap stage:** 6–10 questions. Each phase gets its own targeted questions before being confirmed.

---

## Epic Kickoff

Before each epic starts:
1. Present an epic brief: scope, key decisions, risks, what's explicitly out of scope
2. Ask 4–6 questions specific to the epic
3. Wait for approval before creating any issues

---

## Starting a Phase (issue creation)

- Each issue proposed individually — not created until approved
- Full discovery questions for each issue
- Issues created only after explicit approval

**Question intensity per issue:** 3–6 questions per issue. This is where most of the alignment happens in manual mode.

---

## Implementation

- Full implementation plan presented and approved before any code is written
- Wait for explicit approval ("go ahead", "looks good", etc.) before starting
- Check in after each significant step if requested

---

## Review

- Deep review (`/code-review deep`) after every PR
- Review artifact saved to `docs/reviews/`
- Plan + review creates a full audit trail per issue

---

## TDD

**Status: ENABLED**

When enabled: write failing tests before implementation for all backend and API logic. Tests presented for review alongside the implementation plan.
When disabled: tests written after, or skipped — no enforcement.
