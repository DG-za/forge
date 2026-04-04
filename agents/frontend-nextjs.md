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
