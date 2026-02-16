# Server Logger with Winston and Logwell

The GotArchive project uses **Winston** for server-side logging with a custom **Logwell** transport for remote log ingestion.

## Features

- **Console logging** for development
- **Logwell integration** for production log aggregation
- **Automatic batching** of logs before sending to Logwell
- **Graceful shutdown** handling to flush remaining logs
- **Error handling** with automatic retries

## Configuration

Logger configuration is controlled via environment variables:

```env
# Logwell Configuration
VITE_LOGWELL_ENDPOINT=https://your-logwell-instance.com
VITE_LOGWELL_API_KEY=lw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_LOGWELL_ENABLED=true

# Set to 'production' to use info level, otherwise uses debug
NODE_ENV=production
```

## Usage

### Basic Logging

```typescript
import { logger } from '$lib/server/logger';

// Simple message logging
logger.info('User logged in successfully');
logger.warn('Deprecated API endpoint called');
logger.error('Database connection failed');
logger.debug('Processing request data');

// Logging with metadata
logger.info('User created', {
	userId: '123',
	username: 'john_doe',
	role: 'user'
});

logger.error('Failed to process payment', {
	orderId: '456',
	amount: 99.99,
	error: error.message
});
```

### Log Levels

Winston supports the following log levels (in order of priority):

- `error` - Error events
- `warn` - Warning messages
- `info` - Informational messages
- `debug` - Debug information (only in development)

### Error Logging

When logging errors, pass the error object in the metadata:

```typescript
try {
	await someAsyncOperation();
} catch (error) {
	logger.error('Operation failed', {
		operation: 'someAsyncOperation',
		error:
			error instanceof Error
				? {
						name: error.name,
						message: error.message,
						stack: error.stack
					}
				: String(error)
	});
}
```

### Structured Logging

Always use structured metadata for better log searchability:

```typescript
// Good ✅
logger.info('Request completed', {
	method: 'GET',
	path: '/api/users',
	status: 200,
	duration: 150
});

// Bad ❌
logger.info(`Request completed: GET /api/users - 200 - 150ms`);
```

## Architecture

### Components

1. **Winston Logger** (`src/lib/server/logger/index.ts`)
   - Main logger instance
   - Console transport for development
   - Logwell transport for production

2. **Logwell Transport** (`src/lib/server/logger/logwellTransport.ts`)
   - Custom Winston transport
   - Integrates with Logwell SDK
   - Maps Winston log levels to Logwell levels

3. **Logwell Client**
   - Handles batching and retries
   - Sends logs to Logwell ingest API
   - Automatic queue management

### Log Flow

```
Application Code
      ↓
Winston Logger
      ↓
  ┌───┴───┐
  │       │
Console Logwell Transport
  │       │
  ↓       ↓
stdout  Logwell SDK
          ↓
    Batching Queue
          ↓
   Logwell Ingest API
```

## Graceful Shutdown

The logger automatically handles graceful shutdown on process termination:

```typescript
// Automatically registered in logger/index.ts
process.on('SIGTERM', shutdownHandler);
process.on('SIGINT', shutdownHandler);
process.on('beforeExit', shutdownHandler);
```

This ensures all queued logs are flushed before the process exits.

## Migration from Pino

The logger API has been updated to use Winston's format:

### Before (Pino)

```typescript
logger.info({ msg: 'User logged in', userId: '123' });
logger.error({ error: e }, 'Operation failed');
```

### After (Winston)

```typescript
logger.info('User logged in', { userId: '123' });
logger.error('Operation failed', { error: e });
```

**Note**: Message comes first, metadata second.

## Troubleshooting

### Logs not appearing in Logwell

1. Check environment variables are set correctly
2. Verify `VITE_LOGWELL_ENABLED=true`
3. Check Logwell endpoint is accessible
4. Review console for Logwell errors

### Performance issues

Adjust batching configuration in `src/lib/server/logger/index.ts`:

```typescript
const logwell = new Logwell({
	// ... other config
	batchSize: 50, // Increase for less frequent sends
	flushInterval: 5000, // Increase for longer batching window
	maxQueueSize: 1000 // Adjust based on memory constraints
});
```

## Best Practices

1. **Use appropriate log levels**
   - Use `debug` for verbose development information
   - Use `info` for important application events
   - Use `warn` for recoverable issues
   - Use `error` for failures

2. **Include contextual metadata**
   - Always include relevant IDs (userId, orderId, etc.)
   - Add timing information for performance tracking
   - Include error details when logging failures

3. **Avoid logging sensitive data**
   - Never log passwords, API keys, or tokens
   - Sanitize user input before logging
   - Be careful with PII (personally identifiable information)

4. **Keep messages concise**
   - Use clear, descriptive messages
   - Put details in metadata, not in the message
   - Use consistent message formats

## Example

```typescript
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const startTime = Date.now();

	try {
		const data = await request.json();

		logger.debug('Processing request', {
			endpoint: '/api/users',
			method: 'POST',
			userId: locals.user?.id
		});

		const result = await createUser(data);

		logger.info('User created successfully', {
			userId: result.id,
			duration: Date.now() - startTime
		});

		return json(result);
	} catch (error) {
		logger.error('Failed to create user', {
			error: error instanceof Error ? error.message : String(error),
			duration: Date.now() - startTime
		});

		throw error;
	}
};
```
