# Logging & Error Handling System

This document explains the new unified logging and error handling system for GotArchive.

## Overview

The application now uses:

- **Pino** for structured logging (replaced Winston and Sentry)
- **BetterStack** for log aggregation and monitoring (with separate sources for frontend/backend)
- **Unified AppError** class (replaced ServiceError, FormError, AnilistError)

## Logging

### Server-Side Logging (src/lib/server/logger.ts)

```typescript
import { logger } from '$lib/server/logger';

// Simple logging
logger.info('User logged in');
logger.error('Database connection failed');

// Structured logging (recommended)
logger.info({
	msg: 'User logged in',
	userId: user.id,
	timestamp: new Date()
});

// Error logging with context
logger.error({
	msg: 'Database query failed',
	query: 'SELECT * FROM users',
	error: {
		name: err.name,
		message: err.message,
		stack: err.stack
	}
});
```

**Log Levels:** `trace`, `debug`, `info`, `warn`, `error`, `fatal`

### Client-Side Logging (src/lib/client/logger.ts)

```typescript
import { logger } from '$lib/client/logger';

// Works the same as server logger
logger.info('Component mounted');
logger.error({ msg: 'API call failed', endpoint: '/api/users' });
```

### BetterStack Integration

**Environment Variables:**

```bash
# Backend logging (Node.js source)
BETTERSTACK_BACKEND_TOKEN=your_backend_token
BETTERSTACK_BACKEND_HOST=https://in.logs.betterstack.com  # Your backend source ingestion endpoint

# Frontend logging (Svelte source)
PUBLIC_BETTERSTACK_FRONTEND_TOKEN=your_frontend_token
PUBLIC_BETTERSTACK_FRONTEND_HOST=https://in.logs.betterstack.com  # Your frontend source ingestion endpoint

# Enable in development for testing (optional)
BETTERSTACK_ENABLED=true
PUBLIC_BETTERSTACK_ENABLED=true
```

**How to get these values:**

1. Go to https://logs.betterstack.com/sources
2. For your **Node.js source**:
   - Click on the source
   - Copy the **Source token** → `BETTERSTACK_BACKEND_TOKEN`
   - Copy the **Ingestion endpoint** (e.g., `https://in.logs.betterstack.com`) → `BETTERSTACK_BACKEND_HOST`
3. For your **JavaScript/Browser source**:
   - Click on the source
   - Copy the **Source token** → `PUBLIC_BETTERSTACK_FRONTEND_TOKEN`
   - Copy the **Ingestion endpoint** → `PUBLIC_BETTERSTACK_FRONTEND_HOST`

**Behavior:**

- **Production**: Always sends logs to BetterStack if both token AND host are configured
- **Development**:
  - Console logs with pretty-print (pino-pretty)
  - Only sends to BetterStack if `BETTERSTACK_ENABLED=true` (and token + host configured)

## Error Handling

### AppError Class

The unified error class replaces all previous error types:

```typescript
import { AppError, ERROR_CODES } from '$lib/errors';

// Service/database error
throw new AppError(ERROR_CODES.postgres.UNIQUE_VIOLATION, {
	cause: originalError,
	context: { tableName: 'users', email: 'test@example.com' }
});

// Form validation error
throw new AppError(ERROR_CODES.forms.VALIDATION_FAILED, {
	context: { form: 'login', fields: ['email', 'password'] }
});

// Anilist API error
throw new AppError(ERROR_CODES.anilist.NETWORK_ERROR, {
	cause: fetchError,
	context: { animeId: 12345, retries: 3 }
});
```

### Error Structure

All errors have a flat structure optimized for BetterStack queries:

```typescript
{
  name: 'AppError',
  message: 'This item already exists.',
  code: 'DB001',           // Error code for categorization
  type: 'service',         // 'service' | 'form' | 'anilist' | 'generic'
  httpStatus: 409,         // HTTP status code
  timestamp: '2024-01-15T...',
  context: {               // Domain-specific data
    tableName: 'users',
    email: 'test@example.com'
  },
  cause: OriginalError     // Original error for debugging
}
```

### Error Codes

All error codes are defined in `src/lib/errors/codes.ts`:

```typescript
ERROR_CODES.postgres.*      // Database errors (DB001, DB002, ...)
ERROR_CODES.validation.*    // Validation errors (VAL001, VAL002, ...)
ERROR_CODES.anilist.*       // Anilist API errors (ANI001, ANI101, ...)
ERROR_CODES.forms.*         // Form processing errors (FORM001, FORM002, ...)
ERROR_CODES.generic.*       // Generic errors (GEN000, GEN404)
```

## Best Practices

### 1. Always Use Structured Logging

❌ Bad:

```typescript
logger.info('User ' + userId + ' logged in at ' + timestamp);
```

✅ Good:

```typescript
logger.info({
	msg: 'User logged in',
	userId,
	timestamp
});
```

### 2. Preserve Error Causes

Always include the original error as `cause`:

```typescript
try {
  await db.query(...);
} catch (error) {
  throw new AppError(ERROR_CODES.postgres.SYNTAX_ERROR, {
    cause: error,  // Preserve original error
    context: { query: 'SELECT...' }
  });
}
```

### 3. Add Contextual Information

Include relevant context to help debugging:

```typescript
throw new AppError(ERROR_CODES.forms.VALIDATION_FAILED, {
	context: {
		form: 'new-anime',
		fields: ['title', 'year'],
		values: { title: '', year: 2024 }
	}
});
```

### 4. Use Appropriate Error Codes

Choose the most specific error code:

```typescript
// Good - specific
ERROR_CODES.postgres.UNIQUE_VIOLATION;

// Bad - too generic
ERROR_CODES.postgres.UNDEFINED;
```

### 5. Log Errors at the Right Level

```typescript
// Expected errors (business logic) - warn
if (!user) {
	logger.warn({ msg: 'User not found', userId });
}

// Unexpected errors - error
try {
	await criticalOperation();
} catch (err) {
	logger.error({
		msg: 'Critical operation failed',
		error: err
	});
}
```

## Common Patterns

### Server Actions (Form Handlers)

```typescript
export const actions: Actions = {
	create: async ({ request, url }) => {
		const form = await superValidate(request, zod(formSchema));

		if (!form.valid) {
			return fail(422, { form, text: ERROR_CODES.forms.VALIDATION_FAILED.message });
		}

		try {
			await db.insert(schema.anime).values(form.data);
		} catch (err) {
			// Log unexpected errors
			if (!(err instanceof AppError)) {
				logger.error({
					msg: 'Unexpected error in create anime form',
					url: url.pathname,
					form: 'new-anime',
					error:
						err instanceof Error
							? {
									name: err.name,
									message: err.message,
									stack: err.stack
								}
							: err
				});
			}

			// Return appropriate response
			if (err instanceof AppError) {
				return fail(err.httpStatus, { form, text: err.message });
			}
			return fail(500, { form, text: 'Unexpected error occurred' });
		}
	}
};
```

### API Routes

```typescript
import { logger } from '$lib/server/logger';
import { AppError, ERROR_CODES } from '$lib/errors';

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		logger.debug({
			msg: 'API request',
			endpoint: url.pathname,
			params
		});

		const data = await fetchData(params.id);
		return json(data);
	} catch (err) {
		if (!(err instanceof AppError)) {
			logger.error({
				msg: 'API error',
				endpoint: url.pathname,
				error: err
			});
		}

		throw err; // Let hooks.server.ts handle it
	}
};
```

### Database Service Layer

```typescript
import { handleError } from '$lib/server/db/shared/errorHandler';

export async function createUser(userData: UserInsert) {
	try {
		return await db.insert(schema.users).values(userData).returning();
	} catch (error) {
		handleError(error, 'userService.createUser');
	}
}
```

## Querying Logs in BetterStack

The flat error structure makes querying easy:

```
# Find all form validation errors
type:form code:FORM001

# Find all database errors for a specific table
type:service context.tableName:users

# Find errors from a specific endpoint
url:/api/anime/*

# Find errors with high HTTP status
httpStatus:>=500
```

## Migration Guide

### Old Pattern → New Pattern

```typescript
// OLD: ServiceError
throw new ServiceError(ERROR_CODES.postgres.UNIQUE_VIOLATION, {
	cause: error,
	metadata: { table: 'users' }
});

// NEW: AppError
throw new AppError(ERROR_CODES.postgres.UNIQUE_VIOLATION, {
	cause: error,
	context: { table: 'users' }
});
```

```typescript
// OLD: FormError
throw new FormError(ERROR_CODES.forms.VALIDATION_FAILED, {
	form: 'login'
});

// NEW: AppError
throw new AppError(ERROR_CODES.forms.VALIDATION_FAILED, {
	context: { form: 'login' }
});
```

```typescript
// OLD: Sentry logging
sentry.logServer(error, { tags: { url, form } });

// NEW: Pino logging
logger.error({
	msg: 'Form error',
	url,
	form,
	error:
		error instanceof Error
			? {
					name: error.name,
					message: error.message,
					stack: error.stack
				}
			: error
});
```

## Files Modified

**New Files:**

- `src/lib/server/logger.ts` - Server-side Pino logger
- `src/lib/client/logger.ts` - Client-side logger
- `.env.example` - Environment variable documentation

**Modified Files:**

- `src/lib/errors/appError.ts` - Unified error class
- `src/lib/errors/index.ts` - Updated exports
- `src/lib/errors/types.ts` - Simplified types
- `src/lib/server/db/shared/errorHandler.ts` - Uses Pino + AppError
- `src/hooks.server.ts` - Enhanced error handling with logging
- `src/lib/anilist/client.ts` - Updated to AppError
- `src/lib/anilist/services.ts` - Updated to AppError
- `src/lib/server/db/idConfig.ts` - Updated to AppError
- `src/routes/**/*.server.ts` - All route handlers updated (~15 files)

**Deleted Files:**

- `src/lib/errors/serviceError.ts`
- `src/lib/errors/formError.ts`
- `src/lib/errors/anilistError.ts`
- `src/lib/server/db/shared/logger.ts` (Winston)

**Removed Dependencies:**

- `winston`
- `@sentry/sveltekit`

## Next Steps

1. Add your BetterStack tokens and hosts to `.env`:

   ```bash
   # Get these from https://logs.betterstack.com/sources

   # Backend (Node.js source)
   BETTERSTACK_BACKEND_TOKEN=your_backend_source_token
   BETTERSTACK_BACKEND_HOST=https://in.logs.betterstack.com  # Or your custom endpoint

   # Frontend (JavaScript source)
   PUBLIC_BETTERSTACK_FRONTEND_TOKEN=your_frontend_source_token
   PUBLIC_BETTERSTACK_FRONTEND_HOST=https://in.logs.betterstack.com  # Or your custom endpoint
   ```

2. Test in development:

   ```bash
   # Enable BetterStack in dev
   BETTERSTACK_ENABLED=true
   PUBLIC_BETTERSTACK_ENABLED=true

   npm run dev
   ```

3. Test in development:

   ```bash
   # Enable BetterStack in dev
   BETTERSTACK_ENABLED=true
   PUBLIC_BETTERSTACK_ENABLED=true

   npm run dev
   ```

4. Monitor logs in BetterStack dashboard

5. Create alerts for critical errors:
   - `httpStatus:>=500` - Server errors
   - `type:service code:DB*` - Database errors
   - `level:fatal` - Fatal errors

## Support

For questions or issues with the logging system:

- Check logs in BetterStack dashboard
- Review error codes in `src/lib/errors/codes.ts`
- See examples in this document
