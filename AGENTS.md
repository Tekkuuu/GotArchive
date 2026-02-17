# AGENTS.md - Coding Guidelines for GotArchive

This document provides comprehensive guidelines for software engineering tasks in the GotArchive repository. Follow these conventions to maintain code quality and consistency.

## Build, Lint, and Test Commands

### Development

- **Start dev server**: `npm run dev` or `vite dev`
- **Build for production**: `npm run build` or `vite build`
- **Preview production build**: `npm run preview` or `vite preview`
- **Start production server**: `npm run start` or `node build`

### Code Quality

- **Lint code**: `npm run lint` (runs Prettier check + ESLint)
- **Format code**: `npm run format` (Prettier write to fix formatting)
- **Type check**: `npm run check` (SvelteKit sync + svelte-check --tsconfig)
- **Watch type checking**: `npm run check:watch`

### Testing

- **Run all tests**: `npm run test` (unit tests + e2e tests)
- **Run unit tests only**: `npm run test:unit` or `vitest`
- **Run e2e tests only**: `npm run test:e2e` or `playwright test`
- **Run single unit test file**: `vitest run <path/to/test.ts>` (e.g., `vitest run src/lib/util/schedule/watchAfterParser.test.ts`)
- **Run single e2e test file**: `playwright test <path/to/test.ts>` (e.g., `playwright test e2e/demo.test.ts`)
- **Run tests in watch mode**: `vitest` (without --run flag)
- **Run tests with UI**: `vitest --ui`

### Database

- **Push schema changes**: `npm run db:push` (Drizzle push to database)
- **Run migrations**: `npm run db:migrate` (Drizzle migrate)
- **Open database studio**: `npm run db:studio` (Drizzle studio GUI)
- **Database transfer**: `npm run db:transfer` (runs transfer script)
- **Create admin user**: `npm run create-admin` (creates admin account)

## Code Style Guidelines

### Formatting (Prettier)

```json
{
	"useTabs": true,
	"singleQuote": true,
	"trailingComma": "none",
	"printWidth": 100,
	"plugins": ["prettier-plugin-svelte", "prettier-plugin-tailwindcss"]
}
```

- Use tabs for indentation
- Single quotes for strings
- No trailing commas
- 100 character line width
- Svelte and Tailwind CSS plugin support

### Linting (ESLint)

- TypeScript recommended rules
- Svelte recommended rules + prettier integration
- Browser and Node.js globals available
- No Prettier conflicts (handled by eslint-config-prettier)

### TypeScript Configuration

- **Strict mode**: Enabled for all type checking
- **Target**: ESNext with DOM and DOM.Iterable libs
- **Module resolution**: Bundler (supports package.json "type": "module")
- **Module syntax**: Verbatim (no automatic type-only imports)
- **Isolated modules**: Required for proper bundling
- **No emit**: Type checking only

### Import Conventions

- Use ES6 import syntax
- Group imports: external libraries first, then internal imports
- Use relative imports for files in the same directory
- Use `$lib/` path alias for src/lib imports (SvelteKit convention)
- No wildcard imports (`import * as`)
- Prefer named imports over default imports

```typescript
import { add, parseISO } from 'date-fns';
import { z } from 'zod';
import { schema } from '$lib/server/db';
import { parseDurationString } from '../util/watchAfterParser';
```

### Naming Conventions

#### Variables and Functions

- **camelCase** for variables, functions, and methods
- **PascalCase** for classes, interfaces, types, and components
- **SCREAMING_SNAKE_CASE** for constants
- Prefix boolean variables with `is`, `has`, `can`, `should`
- Use descriptive names; avoid abbreviations unless widely understood

#### Files and Directories

- **kebab-case** for file names (e.g., `watch-after-parser.ts`)
- **PascalCase** for Svelte components (e.g., `AnimeCard.svelte`)
- **camelCase** for utility directories (e.g., `src/lib/util/schedule/`)
- Server files use `+page.server.ts`, `+layout.server.ts` pattern

#### Database

- **snake_case** for table and column names
- **camelCase** for JavaScript/TypeScript property names
- Schema definitions in `src/lib/server/db/shared/schema.ts`

### Error Handling

- Use custom error classes from `$lib/errors/`
- Wrap database operations with error origin tracking
- Log errors using Pino logger with Logwell
- Prefer specific error types over generic Error
- Use try-catch for async operations

```typescript
import { AppError, ServiceError } from '$lib/errors';

try {
	const result = await someDatabaseOperation();
	return result;
} catch (error) {
	throw new ServiceError('Failed to fetch data', { cause: error });
}
```

### Component Patterns (Svelte)

#### Props Interface

```svelte
<script lang="ts">
  interface Props {
    title: string;
    disabled?: boolean;
    onClick?: () => void;
  }

  let { title, disabled = false, onClick }: Props = $props();
</script>
```

#### Event Handlers

- Use lowercase event handlers: `onclick`, `oninput`, `onchange` (Svelte convention)
- Prefix custom events with descriptive names
- Use inline arrow functions for simple handlers
- Extract complex logic to separate functions

#### Styling

- Use Tailwind CSS classes
- Dark mode support with `dark:` prefixes
- Component-specific classes use `class:` directive
- Avoid inline styles

**Design Philosophy:**

- **Modern and Minimalistic**: Keep designs clean with ample whitespace and simple layouts
- **Spacing**: Use gap/padding/margin values of **2 or less** (Tailwind units: `gap-1`, `gap-2`, `p-2`, etc.)
  - Use larger spacing values (3-4) sparingly, only when it significantly improves visual hierarchy
- **Mobile-First**: Always design for mobile screens as narrow as **384px** (iPhone SE width)
  - Use responsive breakpoints: `sm:`, `md:`, `lg:` for larger screens
  - Test layouts at 384px, 768px (tablet), and 1024px+ (desktop) widths
- **Consistency**: Maintain uniform spacing throughout the application for cohesive design

#### Stores and State

- Use Svelte 5 runes for reactive state
- `$state()`, `$derived()`, `$effect()` for local component state
- Svelte stores for global state (`src/lib/stores/`)
- Local storage integration via custom stores

### Testing Patterns

#### Unit Tests (Vitest)

- Test files: `*.test.ts`, `*.spec.ts`
- Client tests: Svelte components with jsdom environment
- Server tests: Node.js environment for utilities/services
- Use descriptive test names and `describe` blocks
- Mock external dependencies appropriately

```typescript
import { describe, it, expect } from 'vitest';
import { parseDurationString } from './watchAfterParser';

describe('parseDurationString', () => {
	it('parses hours, minutes, seconds', () => {
		expect(parseDurationString('1h30m15s')).toEqual({
			hours: 1,
			minutes: 30,
			seconds: 15
		});
	});
});
```

#### E2E Tests (Playwright)

- Located in `e2e/` directory
- Test against production build (auto-started by config)
- Use page object pattern for complex interactions
- Focus on user journeys and critical paths

### Database Patterns

#### Schema Definition

- Use Drizzle ORM with PostgreSQL
- Define schemas in `src/lib/server/db/shared/schema.ts`
- Use relations for foreign key constraints
- Custom methods in `src/lib/server/db/customMethods/`

#### Service Layer

- Services created via factory pattern (`serviceFactory.ts`)
- Error origin tracking for debugging
- Type-safe ID configurations with Zod validation
- Consistent CRUD operations across entities

### Architecture Patterns

#### File Structure

```
src/
├── lib/
│   ├── components/     # Reusable UI components
│   ├── stores/         # Svelte stores for state management
│   ├── hooks/          # Custom Svelte hooks
│   ├── server/         # Server-only code (APIs, DB)
│   ├── util/           # Utility functions
│   └── errors/         # Error classes and handling
├── routes/             # SvelteKit routes
│   ├── api/            # API endpoints
│   └── [dynamic]/      # Dynamic routes
test/                   # Unit tests
e2e/                    # E2E tests
```

#### Server/Client Separation

- Server code in `*.server.ts` files (never imported in client)
- Client-only code in regular `*.ts` files
- Shared utilities must be framework-agnostic
- Environment-specific logic properly isolated

### Security Best Practices

- Never log sensitive data (passwords, tokens, keys)
- Use environment variables for secrets
- Validate all user inputs with Zod schemas
- Sanitize database queries to prevent injection
- Use HTTPS in production (handled by adapter)

### Performance Considerations

- Lazy load components when possible
- Use Svelte's reactive statements efficiently
- Optimize database queries with proper indexing
- Cache expensive computations in stores
- Minimize bundle size with tree shaking

### Commit Message Convention

Follow conventional commits:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

---

_This document should be updated as the codebase evolves. Last updated: January 2026_</content>
<parameter name="filePath">C:\Users\Tekku\Desktop\GotArchive\AGENTS.md
