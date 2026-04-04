## Testing 🧪

### Test Location

Tests live in a **separate top-level folder** (e.g. `test/`, `tests/`, `__tests__/`) outside of `src/`. Test code and application code must not mix — no test files inside `src/`.

### What to Test

Test code that **makes decisions**: branching, data transformation, validation, conditional logic. These are the places bugs hide.

- Test **public interfaces**. Verify private logic through public-facing code.
- Test **behaviour**, not implementation. If you refactor internals, tests should still pass.

### What Not to Test

- **Object shape** — don't test that a DTO has the right fields.
- **Trivial accessors** — getters, setters, simple pass-throughs.
- **Library behaviour** — don't verify that `Array.filter` works.
- **Code that merely describes shape** — object literals, type definitions, trivial delegation.

### Test Quality

- **Names follow `should ...` convention** and verify a single behaviour each.
- **Arrange / Act / Assert** — blank line between each phase. Keep each phase short.
- **Assert the minimum** needed to prove the claim. Extra assertions obscure intent and couple tests to unrelated details.

### When to Skip Tests

- **Unlikely edge cases.** Don't test for scenarios that won't happen in practice.
- **Small utility projects.** Manual testing is acceptable when the blast radius is small.
- **Coverage numbers don't matter.** A project with 40% meaningful coverage is better than 90% trivial coverage.

### When Edge Cases Are Ambiguous

Ask for clarification rather than guessing. Don't silently pick a behaviour — make it an explicit decision.

### Bug Fixes

When a bug is detected, **first write the test that reproduces the bug**, then fix the code. The test must fail before the fix and pass after. This proves the fix works and prevents regressions.

### Integration and E2E Tests

- Integration tests verify real interactions (database, APIs). Use them for code that touches external systems.
- E2E tests verify user-facing workflows. Include them for features with a UI.
- Both are more valuable than unit tests for catching real bugs, but slower — use judiciously.
