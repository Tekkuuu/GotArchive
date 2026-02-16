import postgres from 'postgres';
import { logger } from '$lib/server/logger';
import { AppError, ERROR_CODES } from '$lib/errors';

/**
 * Centralized error handler for the service layer.
 * It catches raw errors and translates them into structured AppErrors,
 * ensuring the original error cause is always preserved.
 *
 * Best practices:
 * - Always preserve the original error as `cause`
 * - Add contextual information to help with debugging
 * - Log errors with structured data for BetterStack
 * - Use specific error codes for different scenarios
 *
 * @param error - The error to handle.
 * @param origin - A string identifying where the error occurred (e.g., 'userService.create').
 * @returns This function never returns, it always throws.
 *
 * @example
 * ```typescript
 * try {
 *   await db.insert(users).values(userData);
 * } catch (error) {
 *   handleError(error, 'userService.create');
 * }
 * ```
 */
export function handleError(error: unknown, origin?: string): never {
	// If the error is already an AppError, log it and re-throw.
	if (error instanceof AppError) {
		logger.warn('Known AppError caught and re-thrown', {
			origin: origin || 'Unknown origin',
			...error.toJSON()
		});
		throw error;
	}

	// Handle specific database errors
	if (error instanceof postgres.PostgresError) {
		const errorOrigin = origin || 'Database Operation';

		logger.error('PostgresError caught', {
			origin: errorOrigin,
			code: error.code,
			detail: error.detail,
			table: error.table_name,
			constraint: error.constraint_name
		});

		// Map PostgreSQL error codes to AppError codes
		const options = {
			cause: error,
			context: {
				origin: errorOrigin,
				table: error.table_name,
				constraint: error.constraint_name,
				detail: error.detail
			}
		};

		switch (error.code) {
			case '23505': // Unique constraint violation
				throw new AppError(ERROR_CODES.postgres.UNIQUE_VIOLATION, options);
			case '23502': // Not-null violation
				throw new AppError(ERROR_CODES.postgres.NOT_NULL_VIOLATION, options);
			case '42601': // Syntax error
				throw new AppError(ERROR_CODES.postgres.SYNTAX_ERROR, options);
			default:
				throw new AppError(ERROR_CODES.postgres.UNDEFINED, options);
		}
	}

	// Handle all other unexpected errors
	logger.error('Unexpected error caught', {
		origin: origin || 'Unknown origin',
		error:
			error instanceof Error
				? {
						name: error.name,
						message: error.message,
						stack: error.stack
					}
				: error
	});

	// Wrap the unknown error in a generic internal error, preserving the cause
	throw new AppError(ERROR_CODES.generic.INTERNAL_UNDEFINED, {
		cause: error,
		context: {
			origin: origin || 'Unknown origin'
		}
	});
}
