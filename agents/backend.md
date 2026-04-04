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
