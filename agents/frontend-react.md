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
