# AGENTS.md

## Project Overview

Fire-and-forget autonomous task runner — dispatches AI agents to work through GitHub epics. TypeScript dispatcher using the Claude Agent SDK, with a Next.js mobile-first web UI for triggering and monitoring.

**Stack:** TypeScript, Claude Agent SDK, Next.js, Docker

## Common Commands

<!-- Will be filled in as the project develops -->

## Directory Structure

<!-- Will be filled in as the project develops -->

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

### File Size Limits 📏

| File type | Target | Hard max | Notes |
|---|---|---|---|
| Sequential logic (most files) | 100 lines | 150 lines | Files where you read top-to-bottom to understand the logic |
| Collections (CRUD services, utility helpers) | 100 lines | 300 lines | Files where each function is independent — readers jump to a specific function |
| Test files | No limit | — | Tests are exempt |

If a file exceeds the target, look for extraction opportunities. If it exceeds the hard max, split it.

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

> This section will be expanded by [issue #64](https://github.com/DG-za/second-brain/issues/64) — a distillation of Clean Code principles into agent-usable rules.

### Established Rules

- **Functions should do one thing.** If you can describe what a function does with "and", split it.
- **No dead code.** Unused variables, unreachable branches, and commented-out code must be removed.
- **No magic numbers or strings.** Use named constants. The reader shouldn't have to guess what `86400` means.
- **Consistent abstraction levels within a function.** Don't mix high-level orchestration with low-level detail in the same function.
- **Meaningful names over comments.** If you need a comment to explain what a variable or function is, rename it instead.

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

## Backend — General Rules ⚙️

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

### Components

- **Function components only.** No class components.
- **One component per file.** Named export matching the file name.
- **Feature-based structure.** Group by feature, not by type. `dashboard/` contains the components, hooks, and types for that feature — not a separate `components/` and `hooks/` folder.

### State Management

- **`useState` for local state.** Start here. Don't reach for anything else until you need it.
- **`useReducer` for complex local state** — multiple related values, or when the next state depends on the previous.
- **React Context for shared state** that multiple components need (auth, theme, user session). Don't use Context for frequently-updating values — it re-renders all consumers.
- **No external state library** unless Context becomes a clear bottleneck.

### Hooks

- **Custom hooks for reusable logic.** Extract into `use<Name>` hooks when logic is shared between components or when a component's hook section exceeds ~15 lines.
- **Keep hooks flat.** Don't nest hooks inside conditions or loops.
- **`useEffect` sparingly.** Most effects are either data fetching (use the framework's loader instead) or synchronisation (often a sign of derived state that should be computed).
- **Cleanup in effects.** Always return a cleanup function for subscriptions, timers, and event listeners.

### Props

- **TypeScript interfaces for props.** Define a `Props` type for every component.
- **Destructure props** in the function signature for readability.
- **Default values via destructuring**, not `defaultProps`.
- **`children` for composition.** Prefer `children` over render props or deeply nested config objects.

### Styling

- **Tailwind CSS or CSS Modules** — pick one and use it consistently.
- **No inline `style` objects** except for truly dynamic values.
- **`className` composition** — use `clsx` or `cn` helper for conditional classes.

### Patterns to Avoid

- **No `any` in props or state.** Use proper types.
- **No index as key** in lists where items can be reordered, added, or removed.
- **No prop drilling past 2 levels.** Use Context or restructure the component tree.
- **No `useEffect` for derived state.** Compute it inline or with `useMemo`.

## Frontend — Next.js ▲

### App Router

- **Use the App Router** (`app/` directory), not the Pages Router.
- **File conventions:** `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`.
- **Layouts for shared UI.** Use `layout.tsx` for headers, navs, and wrappers. Layouts don't re-render on navigation.
- **`loading.tsx`** for route-level loading states. Prefer this over manual loading spinners.

### Server vs Client Components

- **Server Components by default.** Every component is a Server Component unless it needs interactivity.
- **Add `'use client'` only when needed:** event handlers, `useState`, `useEffect`, browser APIs.
- **Push `'use client'` as far down the tree as possible.** Don't make a whole page client-side because one button needs `onClick`.
- **Server Components can import Client Components**, but not the other way around.

### Data Fetching

- **Fetch in Server Components** using `async/await` directly.
- **Server Actions for mutations.** Use the `'use server'` directive for form submissions and data mutations.
- **`revalidatePath` or `revalidateTag`** after mutations to refresh cached data.
- **Avoid client-side `fetch` for initial page data.** Let Server Components handle it.

### Routing

- **File-based routing.** Each folder in `app/` is a route segment.
- **Dynamic routes** with `[param]` folders.
- **Route groups** with `(groupName)` for organising routes without affecting the URL.

### API Routes

- **`route.ts` for API endpoints** when needed (webhooks, external integrations).
- **Prefer Server Actions over API routes** for internal mutations.
- **Type-safe request/response** — validate inputs, return consistent shapes.

### Styling

- **Tailwind CSS** is the recommended default for Next.js projects.
- **`globals.css`** for resets, CSS custom properties, and base styles only.

### Performance

- **`next/image`** for all images.
- **`next/link`** for all internal navigation.
- **`next/font`** for fonts.
- **Dynamic imports** (`next/dynamic`) for heavy client components.

### Environment Variables

- **`NEXT_PUBLIC_` prefix** for variables needed in client components.
- **No prefix** for server-only variables (API keys, secrets).
- **Never expose secrets** with the `NEXT_PUBLIC_` prefix.

## Testing 🧪

### What to Test

Test code that **makes decisions**: branching, data transformation, validation, conditional logic.

- Test **public interfaces**. Verify private logic through public-facing code.
- Test **behaviour**, not implementation.

### What Not to Test

- **Object shape**, **trivial accessors**, **library behaviour**, **code that merely describes shape**.

### Test Quality

- **Names follow `should ...` convention** and verify a single behaviour each.
- **Arrange / Act / Assert** — blank line between each phase.
- **Assert the minimum** needed to prove the claim.

### When to Skip Tests

- **Unlikely edge cases.** Don't test for scenarios that won't happen in practice.
- **Coverage numbers don't matter.** 40% meaningful coverage beats 90% trivial coverage.

### Integration and E2E Tests

- Integration tests verify real interactions. E2E tests verify user-facing workflows.
- Both are more valuable than unit tests for catching real bugs, but slower — use judiciously.

## Code Reviews 🔍

### Scoring System

| Score | Emoji | Meaning |
|---|---|---|
| 1–2 | 🔴 | Significant problems — block merge |
| 3–4 | 🟠 | Notable concerns — fix before merge |
| 5–6 | 🟡 | Acceptable with improvements |
| 7–8 | 🟢 | Good — minor suggestions only |
| 9–10 | 💚 | Excellent — no meaningful issues |

### Review Priority Order

1. **Architecture direction** and boundary quality
2. **Readability** and maintainability
3. **Correctness** issues with meaningful behavioural impact
4. **Test strategy** for decision logic and behaviour changes
5. **Low-priority nits** (max 3)

### Code Smells Checklist

God-classes, deep nesting, unnecessary coupling, dead code, duplicated logic, long functions, magic values, inconsistent abstraction, mutable shared state, leaky abstractions, shotgun surgery.

### Suppression Rules

- Don't report style enforced by tooling.
- Don't request tests for library behaviour.
- Naming is a readability concern, not a nit.
