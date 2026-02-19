# GotArchive — Agent Guidelines

## Project Overview

**GotArchive** is a SvelteKit 2 + Svelte 5 (runes) web application backed by a PostgreSQL database
via Drizzle ORM. It uses TypeScript strict mode throughout, TailwindCSS v4 +
DaisyUI v5 for styling, and `better-auth` for authentication.

---

## Commands

### Development

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run start        # Run production build (node build)
npm run preview      # Preview production build locally
```

### Type Checking & Linting

```bash
npm run check        # svelte-check + TypeScript type check
npm run check:watch  # Same, in watch mode
npm run lint         # Prettier check + ESLint (run before committing)
npm run format       # Auto-format all files with Prettier
```

### Testing

```bash
npm run test                   # All tests: unit + e2e (CI mode)
npm run test:unit              # Vitest in watch mode
npm run test:unit -- --run     # Vitest one-shot (no watch)
npm run test:e2e               # Playwright e2e tests
```

#### Running a single test

```bash
# Single file (unit/server)
npx vitest run src/lib/util/dates.spec.ts

# Single file (component — client workspace)
npx vitest run --project client src/lib/components/MyComponent.svelte.spec.ts

# Single test by name pattern
npx vitest run -t "should parse schedule entry"

# Single Playwright e2e test
npx playwright test e2e/demo.test.ts
```

### Database

```bash
npm run db:push      # Push schema changes directly (dev only)
npm run db:migrate   # Run pending migrations
npm run db:studio    # Open Drizzle Studio GUI
npm run db:transfer  # Run data transfer script (scripts/transfer.ts)
```

---

## Architecture

- **`src/routes/`** — SvelteKit file-based routing (`+page.svelte`, `+page.server.ts`, `+server.ts`)
- **`src/lib/`** — All shared code, aliased as `$lib`
  - `components/` — Svelte components (`ui/` for navbar, toaster, suspense; `schedule/` for domain-specific slot/entry forms)
  - `server/` — Server-only code (DB, auth, logger, Redis) — never import in client components
  - `schemas/` — Zod v4 validation schemas
  - `errors/` — `AppError` class and `ERROR_CODES` catalog
  - `stores/` — Svelte 5 rune-based reactive state (`.svelte.ts` files)
  - `util/` — Pure utility functions
  - `hooks/` — Server-side data hooks
  - `api/` — Client-side API helpers and shared types
- **`drizzle/`** — Migration snapshots managed by drizzle-kit
- **`e2e/`** — Playwright end-to-end tests
- **`test/`** — Vitest unit/integration tests (mirrors `src/` structure)
- **`scripts/`** — One-off utility scripts (run with `tsx`)

---

## Code Style

### Formatting (Prettier)

- **Indentation:** Tabs (not spaces)
- **Quotes:** Single quotes
- **Trailing commas:** None
- **Print width:** 100 characters
- Always run `npm run format` or ensure your editor uses the `.prettierrc` settings.

### TypeScript

- `strict: true` is enabled — no `any`, no implicit `any`, no non-null assertions without reason.
- Use `import type { ... }` for type-only imports (`verbatimModuleSyntax` is enabled).
- Prefer `interface` for object shapes; use `type` for unions, intersections, and aliases.
- Export table row types using Drizzle's `$inferSelect` / `$inferInsert` pattern from `db/types.ts`.
- No `as` casts without a justifying comment unless truly unavoidable.

### Imports

- Use the `$lib` alias for all internal imports — never use relative `../../` paths from `src/`.
- SvelteKit built-ins: `$app/environment`, `$app/navigation`, `$app/state`, `$env/dynamic/private`.
- Group imports: external packages → `$lib/server/...` → `$lib/...` → local/relative.
- Import Lucide icons individually: `import { Search } from 'lucide-svelte'`.
- Use barrel `index.ts` files within `$lib` subdirectories where they already exist.

### Naming Conventions

| Thing                 | Convention             | Example                                |
| --------------------- | ---------------------- | -------------------------------------- |
| Files (TS/JS)         | `camelCase`            | `dateUtils.ts`                         |
| Files (Svelte)        | `PascalCase`           | `ScheduleCard.svelte`                  |
| Directories           | `kebab-case`           | `schedule/`, `ui/`                     |
| SvelteKit files       | SvelteKit convention   | `+page.server.ts`                      |
| Svelte 5 store files  | `camelCase.svelte.ts`  | `themeStore.svelte.ts`                 |
| Variables/functions   | `camelCase`            | `scheduleEntry`                        |
| Types/interfaces      | `PascalCase`           | `ScheduleEntry`                        |
| Constants             | `SCREAMING_SNAKE_CASE` | `ERROR_CODES`, `WEEKDAYS`              |
| DB table names (JS)   | `camelCase`            | `scheduleEntry`                        |
| DB column names (SQL) | `snake_case`           | `schedule_entry`                       |
| Error code prefixes   | domain-scoped          | `DB_`, `VAL_`, `ANI_`, `FORM_`, `GEN_` |

### Svelte 5 (Runes)

- Use runes exclusively: `$state`, `$derived`, `$effect`, `$props()`, `{@render children()}`.
- Do **not** use legacy Svelte 4 APIs: `writable`, `readable`, `derived`, `$:`, etc.
- Declare component props with an `interface Props`, then destructure: `let { id, value }: Props = $props()`.
- Prefer `$derived()` for computed values over `$effect` + manual assignment.
- Singleton reactive state for shared UI state: class with `$state` fields, exported as a module-level instance.
- Getter functions (e.g., `getThemeStore()`) prevent SSR duplication of store instances.

### Error Handling

- Throw `AppError` (from `$lib/errors`) for all application errors — never plain `Error` in app code.
- Reference `ERROR_CODES` catalog for the appropriate code; add new codes there if needed.
- In server `load` functions: catch errors, log with `logger.error()`, and push to an `errors[]` array for non-fatal failures rather than aborting the entire load.
- In API routes and form actions: use `handleApiError()` to convert `AppError` to a JSON response; re-throw unknown errors.
- Use SvelteKit's `fail()` for form validation failures in actions.
- Always include `cause` and `context` when constructing `AppError` for structured logging.

### Database (Drizzle ORM)

- All DB access must be server-side only (inside `+page.server.ts`, `+server.ts`, or `$lib/server/`).
- Use the fluent query builder; reference columns with the schema object (e.g., `schema.schedule.scheduleId`).
- Wrap multi-table mutations in `db.transaction(async (tx) => { ... })`.
- The auth tables live in the `bauth` PostgreSQL schema — do not directly mutate them; use `better-auth` APIs.
- Never write raw SQL strings unless drizzle cannot express the query.

### Forms

- Use `sveltekit-superforms` + the `zod4Client` adapter for any non-trivial form.
- Define form schemas in `$lib/schemas/` using Zod v4.
- Use `use:enhance` for progressive form enhancement on all `<form>` elements.

### Styling

- TailwindCSS v4 utility classes directly in templates.
- DaisyUI v5 component classes for interactive elements (buttons, modals, inputs, etc.).
- Use `tailwind-merge` (`twMerge`) when merging conditional class strings.
- Theming is managed via `themeStore.svelte.ts`; respect `data-theme` attribute on `<html>`.

---

## Testing Guidelines

- **Unit/server tests:** `src/**/*.{spec,test}.ts` or `test/**/*.{spec,test}.ts` — run in Node environment.
- **Component tests:** `src/**/*.svelte.{spec,test}.ts` — run in jsdom environment with `@testing-library/svelte`.
- Use `describe` / `it` / `expect` from Vitest; `@testing-library/jest-dom` matchers are available.
- The `test/db/` path is reserved for future database integration tests (excluded from the standard run).
- Playwright e2e tests live in `e2e/` and require the production build to be running.

---

## Environment

Copy `.env.example` to `.env` and fill in the required values before running locally.
Key variables: `DATABASE_URL` (PostgreSQL), `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`,
`BETTER_AUTH_SECRET`, `QSTASH_TOKEN`, and AniList API credentials.
