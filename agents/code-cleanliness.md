## Code Cleanliness 🧹

High-value rules distilled from Clean Code principles. These complement the general rules — no duplication. Every rule here should be consistently enforced.

**Before marking any issue done, run `scripts/agent-precommit.sh`.** It runs lint, type-check, and tests, then prints a checklist for rules that can't be automated. Rules 1, 8, 18, 20, 35, and 37 below are enforced by ESLint — the rest must be checked manually.

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
