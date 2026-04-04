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
