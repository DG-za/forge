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
