# AGENTS.md

## Project Overview

Fire-and-forget autonomous task runner — dispatches AI agents to work through GitHub epics. TypeScript dispatcher using the Claude Agent SDK, with a Next.js mobile-first web UI for triggering and monitoring.

**Stack:** TypeScript, Claude Agent SDK, Next.js, Docker

## Common Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run format:check # Check formatting
npm run typecheck    # TypeScript type checking
```

## Directory Structure

```
src/
  app/               # Next.js App Router — thin route pages only
  features/          # Feature modules — all domain logic
  components/        # Shared UI components
  dispatcher/        # Task runner — dispatches agents to work through epics
  lib/               # Shared utilities and singletons
  shared/            # Shared types and config
docs/
  decisions/         # Architecture decision records
```

## Git Workflow

- All PRs target `main`
- Branch naming: `feature/<number>-<description>` or `bug/<number>-<description>`
- Branches are auto-deleted on merge

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

## Code Cleanliness 🧹

High-value rules distilled from Clean Code principles. These complement the general rules — no duplication. Every rule here should be consistently enforced.

### Function Design

1. **3 parameters max.** Beyond that, use an options object. Too many parameters means the function is doing too much or its interface is unclear.

2. **No boolean flag parameters.** A boolean parameter means the function does two things. Split it into two functions with clear names instead.

3. **Encapsulate complex conditionals.** If a conditional is longer than one simple comparison, extract it into a named function. `isEligibleForDiscount(user)` beats `user.age > 18 && user.orders.length > 3 && !user.isBanned`.

4. **Avoid negative conditionals.** Write `if (isActive)` not `if (!isDisabled)`. Negations add cognitive load. Name booleans positively.

5. **No side effects in query functions.** A function that answers a question shouldn't also change state. Separate reads from writes — `getUser()` should never modify the database.

6. **One return type.** A function should return one shape. Don't return `User | null | undefined | string`. Pick one success type and one failure mode.

7. **Fail early with guard clauses.** Validate preconditions at the top and return/throw immediately. Don't wrap the entire function body in an `if (valid)` block.

8. **Don't use output parameters.** A function should return its result, not modify a parameter. `const result = transform(data)` not `transform(data, result)`.

### Function Naming

9. **Verb-first for functions that do things.** `createUser`, `validateEmail`, `calculateTotal`. Not `userCreation` or `emailValidator`.

10. **`is/has/can/should` prefix for boolean-returning functions.** `isValid()`, `hasPermission()`, `canEdit()`. Never `checkValid()` — that sounds like it does something.

11. **Name the return value.** If a function returns a filtered list, call it `getActiveUsers()` not `processUsers()`. The name should tell you what you get back.

### Naming

12. **Use explanatory intermediate variables.** Break complex expressions into named steps. `const isEligible = age > 18 && hasVerifiedEmail;` is clearer than inlining the check.

13. **Don't add redundant context.** On a `User` class, use `email` not `userEmail`. The class already provides the context — repeating it adds noise.

14. **Use consistent vocabulary.** Pick one word for one concept and use it everywhere. Don't mix `fetch`, `get`, `retrieve`, and `load` for the same operation.

15. **Collections should be named as plurals.** `users` not `userList`, `orders` not `orderArray`. The type already tells you it's a list.

16. **Name event handlers by what happened.** `onUserCreated` not `sendWelcomeEmail`. The handler name describes the trigger; the implementation decides the action.

17. **Symmetrical naming for paired operations.** `open/close`, `start/stop`, `create/destroy`, `add/remove`. Don't mix `create/delete` or `open/end`.

### Data and State

18. **Don't mutate function arguments.** Clone or spread before modifying. The caller doesn't expect their data to change.

19. **Derived state should be computed, not stored.** If `fullName` can be computed from `firstName` + `lastName`, compute it. Don't store a third variable that can drift out of sync.

20. **Prefer immutability.** Use `readonly`, `const`, and immutable patterns by default. Mutate only when you have a specific reason. Immutable data is easier to reason about and debug.

### Classes and Modules

21. **Single Responsibility.** A class or module should have one reason to change. If you can describe what it does with "and", split it.

22. **Prefer composition over inheritance.** Use "has-a" relationships (inject dependencies, compose behaviours) rather than "is-a" hierarchies. Inheritance creates tight coupling and rigid structures.

23. **One concept per file.** A file with `UserService`, `UserValidator`, and `UserFormatter` should be three files.

### API and Interface Design

24. **Accept the narrowest type, return the widest useful type.** A function that only needs `{ id: string }` shouldn't require a full `User` object. Keeps coupling low.

25. **Make invalid states unrepresentable.** Use TypeScript's type system to prevent impossible combinations. A discriminated union `{ status: 'loading' } | { status: 'success', data: T }` is better than `{ loading: boolean, data: T | null }`.

26. **Consistent function signatures across a module.** If one service method takes `(id: string)` and returns `Promise<User>`, all similar methods should follow the same pattern.

### Structure

27. **Keep helpers near their consumers.** A utility used by one module lives in that module's folder. Only move it to `shared/` when a second consumer needs it.

28. **Avoid temporal coupling.** If `initConfig()` must run before `startServer()`, make that dependency explicit — pass the config as a parameter, don't rely on call order.

29. **Public API first in a file.** Exported functions and types go at the top. Private helpers go below. Readers see what the module offers before diving into how.

30. **Group by feature, not by type.** Don't create `utils/`, `types/`, `helpers/` folders at the project root. Put them in the feature that uses them. Flat is better than nested.

### Component and UI

31. **Separate data fetching from rendering.** The component that fetches data should not be the same one that renders it. Fetch in a container/page, render in a presentational component.

32. **Don't put business logic in event handlers.** Extract it into a function or service. Event handlers should call logic, not contain it.

### Comments

33. **No commented-out code.** Delete it. Version control has the history. Commented-out code creates doubt — "is this important? was it left here intentionally?" The answer is always no.

34. **No section dividers or positional markers.** Don't use `// ========== HELPERS ==========` or `// --- Private Methods ---`. If you need dividers, the file is too long or poorly organised. Split it instead.

### Error Handling

35. **Throw Error objects, not strings.** `throw new Error('User not found')` preserves the stack trace. `throw 'User not found'` loses all debugging context.

36. **Don't silently swallow errors.** Every `catch` block must either log the error, rethrow it, or handle it meaningfully. An empty `catch {}` hides bugs.

### Type Safety

37. **Don't use `any` as a shortcut.** If typing is hard, that's a signal the interface is unclear. Fix the design, don't escape the type system.

### Concurrency

38. **async/await over .then() chains.** Await is more readable, easier to debug, and handles errors with standard try/catch. Use `.then()` only when you need parallel execution with `Promise.all()`.

### Testing Practices

39. **Test the behaviour, not the implementation.** If you refactor internals, tests should still pass. Test inputs and outputs, not which private methods were called.

40. **One assertion per test (conceptually).** You can have multiple `expect` statements, but they should all verify one behaviour. If the test name has "and", split it.

41. **Use factories for test data.** Don't copy-paste object literals across tests. Create a `buildUser()` factory that returns sensible defaults and lets you override specific fields.

### Dependency Management

42. **Explicit dependencies over implicit.** Pass dependencies as parameters or inject them. Don't reach into global state, singletons, or module-level variables.

43. **Don't depend on things you don't use.** If a function takes a `User` but only needs `email`, take `email`. Unnecessary dependencies make code harder to test and refactor.

### Defensive Coding

44. **Validate at the boundary, trust internally.** Validate user input, API responses, and external data at the edge. Once inside the system, trust the types — don't re-validate in every function.

45. **Fail loudly during development, gracefully in production.** Assertions and strict checks in dev catch bugs early. Production error handling should be user-friendly and logged.

### Refactoring Triggers

These are signals that code needs restructuring. When you spot them, fix them:

46. **A function needs a comment explaining what it does** → the name is wrong. Rename the function so the comment becomes unnecessary.

47. **A function has a boolean parameter** → it's doing two things. Split it into two clearly-named functions.

48. **You're copying code from another location** → extract it. If you're about to paste, stop and create a shared function, component, or utility instead.

## Architecture — Medium Projects (1k–50k LOC) 📦

Most projects live here. The goal is clear module boundaries and domain ownership without heavy-handed layering. Keep things findable and loosely coupled — don't over-engineer.

### Structure

- **Module boundaries by domain concept.** One folder per domain area.
- One module = one folder. Each module has a clear entry point (index/barrel export).
- **Folder depth max 3 levels.** If you need more, rethink the grouping.

### Rules

- **Domains own their data and logic.** A domain module handles its own data access, business logic, and API surface. Other modules don't reach in to query or mutate another domain's data directly.
- **Services extract shared logic**, but don't create one service per entity unless justified. A module can have zero services if the logic is simple.
- **Shared types in a common location** (`shared/`, `types/`, or `common/`). Don't duplicate types across modules.
- **Modules should not reach into each other's internals.** Import from the public API (barrel export), not from deep paths.
- **No circular imports.** If module A needs module B and vice versa, extract the shared concern.

### What you DON'T need yet

- **No strict controller → service → repository layering.** A service can query the database directly. Add a repository layer only when data access logic becomes complex or reusable.
- **No formal module classification system.** You don't need to label modules as "domain", "infrastructure", or "integration" — just keep responsibilities clear.
- **No strict dependency direction rules.** Use common sense — avoid circular imports and keep coupling low, but don't enforce a rigid import hierarchy.

### Cross-Domain Communication

When two domains need to interact:

- **Prefer calling a service method** from the other domain's public API. This is simple and clear.
- **Extract a coordinator** only when the interaction becomes complex (3+ domains, multi-step workflows, or transactional boundaries).
- Don't add event systems, message buses, or integration modules until you genuinely need decoupling.

### Example Layout

```
src/
├── auth/
│   ├── index.ts
│   ├── auth.service.ts
│   └── auth.guard.ts
├── users/
│   ├── index.ts
│   ├── users.service.ts
│   └── users.controller.ts
├── shared/
│   ├── types.ts
│   └── utils.ts
└── main.ts
```

### When to Graduate

Move to the large architecture tier when:
- The codebase exceeds ~50k LOC.
- You have 8+ domain modules with complex cross-domain interactions.
- Cross-module coordination requires explicit orchestration or event-driven patterns.
- You're spending real time debugging unexpected side effects from cross-domain coupling.

## Backend — General Rules ⚙️

These rules apply to all backend projects regardless of framework.

### API Design

- **RESTful by default.** Use standard HTTP methods and status codes.
- **Plural nouns for collections:** `/users`, `/orders`, `/jobs`.
- **Consistent URL patterns** across the entire API. Don't mix conventions.
- **Consistent error shape** across all endpoints. Every error response should have the same structure (e.g. `{ message, statusCode }`).

### Service Layer

- **Business logic in services, not controllers.** Controllers are thin — validate input, call service, return response.
- **One service per domain concept.** Don't create god-services that handle everything.
- **Services call repositories/data-access, not the other way around.**

### Database Access

- **ORM preferred.** Prisma for TypeScript, SQLAlchemy for Python. Raw SQL only when the ORM can't express the query.
- **Never put database queries in controllers.** All data access goes through services or repositories.
- **Migrations for all schema changes.** Never modify the database manually. Generated migrations, not hand-written.
- **After schema changes, regenerate the ORM client** (e.g. `npx prisma generate`).

### DTOs and Validation

- **Validate at the boundary.** Validate incoming requests before they reach the service layer.
- **Type-safe DTOs** for request and response shapes. Don't pass raw request bodies into services.
- **Whitelist, don't blacklist.** Only accept the fields you expect. Ignore or reject extras.

### Error Responses

- **Use standard HTTP status codes.** Don't return 200 for errors.
- **Consistent error body** — same shape for every error endpoint.
- **Don't expose internal details.** Stack traces, database errors, and internal paths stay in logs, not responses.

### Logging

- **Use a logging framework**, not `console.log` or `print()`.
- **Log at the right level:** errors for failures, warnings for recoverable issues, info for significant events, debug for development.
- **Include context in log messages:** request ID, user ID, operation name.

### Configuration

- **Environment variables for secrets and per-environment config.**
- **Single config module/file** that reads env vars and exports typed config.
- **Fail fast on startup** if required config is missing. Don't discover missing config at runtime.

## Frontend — General Rules 🖥️

These rules apply to all frontend projects regardless of framework.

### Folder Organisation

**Group by feature, not by file type.** This is the single most important structural decision. Every domain feature gets its own folder containing all related code — components, hooks/services, types, and utilities.

```
features/
  jobs/
    job-card.component.tsx       # Feature-specific component
    job-actions.hook.ts          # Feature-specific hook
    job.types.ts                 # Feature-specific types
    job-detail/                  # Subfolder only for large sub-features
      job-detail.component.tsx
      job-detail-header.component.tsx
  reviews/
    review-card.component.tsx
    review.types.ts
    use-reviews.hook.ts
```

### Where things go

Use this decision table to place files. Every framework-specific template may extend this with framework-specific rules, but the principle is universal.

| What | Where | Example |
|------|-------|---------|
| Feature-specific components | `features/<name>/` | `features/jobs/job-card.component.tsx` |
| Feature-specific hooks/services | `features/<name>/` | `features/jobs/use-jobs.hook.ts` |
| Feature-specific types | `features/<name>/` | `features/jobs/job.types.ts` |
| Shared UI primitives | `components/` or `components/ui/` | `components/ui/button.tsx` |
| Shared components (cross-feature) | `components/` | `components/page-header.component.tsx` |
| Shared hooks/services | `hooks/` or `services/` | `hooks/use-debounce.hook.ts` |
| Shared types | `types/` | `types/api.types.ts` |
| API client, generic utilities | `lib/` or `utils/` | `lib/api-client.ts` |

**If a file belongs to a single feature, it goes in that feature's folder.** Only promote to shared folders when genuinely reused across multiple features.

### Page composition

- **Pages are thin orchestrators.** A page/route component should compose feature components and manage layout — not contain all the markup itself.
- **Don't put feature logic in route/page files.** Pages import from `features/`, they don't implement features inline.
- **Route folders stay lean.** In file-based routing frameworks (Next.js, SvelteKit), route folders contain the page file, layout, loading/error states, and nothing else. Feature code lives in `features/`.

### Reference implementation

When the first feature is built, name it explicitly in the project's AGENTS.md as the **canonical example**:

> **`features/jobs/`** is the reference feature. When building a new feature, follow its structure.

This gives the AI a concrete model to copy rather than inventing structure from scratch.

### Components

- **One component per file.** No exceptions.
- **Components under 150 lines** (template + logic combined). If a component does more than one thing, split it.
- **Extract immediately** when a component or template block is used in more than one place.
- **Smart vs dumb components:** Containers fetch data and manage state. Presentational components receive data via props/inputs and render it. Keep most components dumb.

### State Management

- **Local state first.** Don't reach for global state until you need it.
- **Lift state up** only when two sibling components need the same data.
- **Global state** only for truly app-wide concerns (auth, user session, theme).
- **Avoid prop drilling past 2 levels.** If data passes through components that don't use it, consider a store or context.

### Styling

- **Scoped / component styles preferred.** Avoid global styles except for resets and design tokens.
- **Consistent class naming.** Pick a convention (BEM, utility-first, or scoped classes) and stick with it across the project.
- **Extract repeated styles.** Duplicated CSS is a code smell just like duplicated logic.
- **Dark theme support** from the start if the project has a UI. Easier to add early than retrofit.

### Templates / Markup

- **Semantic HTML.** Use `<button>` not `<div onClick>`. Use `<nav>`, `<main>`, `<section>` where appropriate.
- **No inline logic over 3 lines.** If a conditional, loop, or computation exceeds 3 lines in a template, extract it into a helper, computed property, or child component.
- **One HTML tag per line** for multi-attribute elements. Keeps diffs clean.
- **Keep JavaScript in templates minimal.** Templates describe structure, not behaviour.

### Accessibility (Basics)

- **Alt text** on images.
- **Keyboard navigation** for interactive elements (buttons, links, modals).
- **Semantic HTML** covers most accessibility needs. Don't add ARIA attributes unless semantic HTML is insufficient.

### Forms

- **Validate at the boundary.** Show validation errors to the user, but don't over-validate on every keystroke.
- **Consistent error display.** Pick a pattern (inline, toast, summary) and use it everywhere.
- **Disable submit during async operations** to prevent double-submission.

## Frontend — React ⚛️

React-specific rules that augment the general frontend template.

### File Naming

Use **kebab-case with type suffixes** for all files:

| Type | Pattern | Example |
|---|---|---|
| Component | `name.component.tsx` | `job-card.component.tsx` |
| Hook | `name.hook.ts` | `use-auth.hook.ts` |
| Context | `name.context.tsx` | `theme.context.tsx` |
| Types | `name.types.ts` | `job.types.ts` |
| Utilities | `name.utils.ts` | `date.utils.ts` |
| Tests | `name.test.tsx` | `job-card.test.tsx` |

### Components

- **Function components only.** No class components.
- **One component per file.** Named export matching the file name.
- **Feature-based structure.** Group by feature, not by type. See the general frontend template for the full folder layout and "where things go" decision table.
  ```
  features/jobs/
    jobs-page.component.tsx
    job-card.component.tsx
    job-actions.hook.ts
    job.types.ts
    job.context.tsx
    job-detail/                  # Subfolder only for large sub-features
      job-detail.component.tsx
      job-detail-header.component.tsx
  ```
- **Smart/dumb pattern:** Only page/feature-level containers manage state and side effects. Reusable components must be presentational — props in, callbacks out.
- **No barrel files** (`index.ts` re-exports). Import directly from the source file.

### File Ordering

Within a component file, order sections top to bottom:

1. **Exported component** (the main public API)
2. **Sub-components** (private, used only in this file)
3. **Types** (always at module level — never inside function bodies)
4. **Helpers** (pure functions, formatters, etc.)

### State Management

- **`useState` for local UI state.** Start here. Don't reach for anything else until you need it.
- **`useReducer` for complex local state** — multiple related values, or when the next state depends on the previous.
- **React Context for shared UI state** that multiple components need (auth, theme, user session). Feature-scoped contexts are fine. Don't use Context for frequently-updating values — it re-renders all consumers.
- **TanStack Query for server state** (recommended). It handles loading, error, caching, and revalidation — don't manually track `isLoading`/`error`/`data` with `useState` + `useEffect`. If the project uses TanStack Query, mock at the network or query level in tests.
- **No external client state library** (Redux, Zustand, Jotai) unless Context becomes a clear bottleneck.

### Hooks

- **Custom hooks for reusable logic.** Extract into `use<Name>` hooks when logic is shared between components or when a component's hook section exceeds ~15 lines.
- **Keep hooks flat.** Don't nest hooks inside conditions or loops.
- **`useEffect` sparingly.** Most effects are either data fetching (use TanStack Query or the framework's loader instead) or synchronisation (often a sign of derived state that should be computed). If you reach for `useEffect`, ask if there's a better way first.
- **Cleanup in effects.** Always return a cleanup function for subscriptions, timers, and event listeners.

### Props

- **TypeScript interfaces for props.** Define a `Props` type (or `<ComponentName>Props`) for every component. Always at module level — never inside function bodies.
- **Destructure props** in the function signature for readability.
- **Default values via destructuring**, not `defaultProps`.
- **`children` for composition.** Prefer `children` over render props or deeply nested config objects.

### Styling

- **Tailwind CSS or CSS Modules** — pick one and use it consistently.
- **No inline `style` objects** except for truly dynamic values (e.g. computed widths).
- **`className` composition** — use `clsx` or `cn` helper for conditional classes.

### Patterns to Avoid

- **No `any` in props or state.** Use proper types.
- **No index as key** in lists where items can be reordered, added, or removed.
- **No prop drilling past 2 levels.** Use Context or restructure the component tree.
- **No `useEffect` for derived state.** Compute it inline or with `useMemo`.
- **No type definitions inside function bodies.** Types are always module-level.

### Testing

- **React Testing Library** for component tests. Test behaviour, not implementation.
- **Query by role, label, or text** — not by class name or test ID.
- **`userEvent` over `fireEvent`** — it simulates real user interactions more accurately.
- **Don't test implementation details** — no querying by component internals, no checking state directly.
- **Jest or Vitest** for unit tests on hooks and utilities.

## Frontend — Next.js ▲

Next.js-specific rules that augment the general frontend and React templates.

### Project Structure

Next.js file-based routing can tempt you into dumping all code in route folders. **Don't.** Route folders are for routing — feature code lives in `features/`.

```
src/
  app/                    # Route tree — thin pages only
    (dashboard)/          # Route group
      page.tsx            # Composes features/dashboard/ components
      layout.tsx
    runs/
      [id]/
        page.tsx          # Composes features/runs/ components
        loading.tsx
        not-found.tsx
      new/
        page.tsx
    api/                  # API routes (webhooks, SSE, external integrations)
    layout.tsx            # Root layout
    globals.css
  features/               # Feature modules — all domain logic lives here
    dashboard/
      dashboard-metrics.component.tsx
      use-dashboard-stats.hook.ts
      dashboard.types.ts
    runs/
      components/         # Optional subfolder if feature has many components
        run-card.component.tsx
        run-form.component.tsx
      run.types.ts
      use-runs.hook.ts
      run-actions.ts      # Server actions for this feature
  components/             # Shared UI (shadcn/ui, cross-feature primitives)
    ui/
    nav-bar.component.tsx
    page-header.component.tsx
  hooks/                  # Shared hooks
  lib/                    # API client, utilities
  types/                  # Shared types
```

### Where things go (Next.js-specific)

| What | Where | NOT here |
|------|-------|----|
| Route pages, layouts, loading/error | `app/<route>/` | — |
| Feature components, hooks, types | `features/<name>/` | ~~`app/<route>/`~~ |
| Server Actions for a feature | `features/<name>/` | ~~`app/actions.ts`~~ |
| API routes (SSE, webhooks) | `app/api/` | — |
| Shared queries/data utils | `lib/` | ~~`app/queries.ts`~~ |
| Shared types | `types/` | ~~`app/<name>.types.ts`~~ |
| Shared validation | `lib/` | ~~`app/validation.ts`~~ |

**The `app/` directory should contain almost no `.ts` files that aren't `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, or `route.ts`.** If you're about to create a utility, type, hook, or component file inside `app/`, stop and put it in `features/`, `lib/`, or `components/` instead.

### App Router

- **Use the App Router** (`app/` directory), not the Pages Router.
- **File conventions:** `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`.
- **Layouts for shared UI.** Use `layout.tsx` for headers, navs, and wrappers. Layouts don't re-render on navigation — put persistent UI here.
- **`loading.tsx`** for route-level loading states. Prefer this over manual loading spinners.

### Server vs Client Components

- **Server Components by default.** Every component is a Server Component unless it needs interactivity.
- **Add `'use client'` only when needed:** event handlers, `useState`, `useEffect`, browser APIs, or third-party client-only libraries.
- **Push `'use client'` as far down the tree as possible.** Don't make a whole page client-side because one button needs `onClick`.
- **Server Components can import Client Components**, but not the other way around. Pass server data to client components via props.

### Data Fetching

- **Fetch in Server Components** using `async/await` directly. No need for `useEffect` or client-side fetching for initial data.
- **Server Actions for mutations.** Use the `'use server'` directive for form submissions and data mutations.
- **`revalidatePath` or `revalidateTag`** after mutations to refresh cached data.
- **Avoid client-side `fetch` for initial page data.** Let Server Components handle it.

### Routing

- **File-based routing.** Each folder in `app/` is a route segment.
- **Dynamic routes** with `[param]` folders. Use `generateStaticParams` for static generation where applicable.
- **Route groups** with `(groupName)` for organising routes without affecting the URL.
- **Parallel routes and intercepting routes** only when genuinely needed — they add complexity.

### API Routes

- **`route.ts` for API endpoints** when needed (webhooks, external integrations).
- **Prefer Server Actions over API routes** for internal mutations. API routes are for external consumers.
- **Type-safe request/response** — validate inputs, return consistent shapes.

### Styling

- **Tailwind CSS** is the recommended default for Next.js projects.
- **CSS Modules** as an alternative if Tailwind doesn't fit.
- **`globals.css`** for resets, CSS custom properties, and base styles only.

### Performance

- **`next/image`** for all images — automatic optimisation and lazy loading.
- **`next/link`** for all internal navigation — enables prefetching.
- **`next/font`** for fonts — self-hosted, no layout shift.
- **Dynamic imports** (`next/dynamic`) for heavy client components that aren't needed on initial render.

### Environment Variables

- **`NEXT_PUBLIC_` prefix** for variables needed in client components.
- **No prefix** for server-only variables (API keys, secrets).
- **Never expose secrets** with the `NEXT_PUBLIC_` prefix.

### Testing

- **Playwright for E2E tests.** Test user-facing workflows end-to-end.
- **React Testing Library + Vitest** for component tests.
- **Test Server Components** by testing their output or the pages that render them (E2E), not by importing them directly in unit tests.

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
