import postgres from 'postgres';
import logger from './logger';
import { ServiceError, ERROR_CODES } from '$lib/errors';

/**
 * Centralized error handler for the service layer.
 * It catches raw errors and translates them into structured ServiceErrors,
 * ensuring the original error cause is always preserved.
 *
 * @param error - The error to handle.
 * @param origin - A string identifying where the error occurred (e.g., 'userService.create').
 * @returns This function never returns, it always throws.
 */
export function handleError(error: unknown, origin?: string): never {
	// If the error is already a ServiceError, log it and re-throw.
	if (error instanceof ServiceError) {
		logger.warn('A known ServiceError was caught and re-thrown.', {
			origin: origin || 'Unknown origin',
			code: error.code,
			message: error.message
		});
		throw error;
	}

	// Handle specific database errors
	if (error instanceof postgres.PostgresError) {
		const errorOrigin = origin || 'Database Operation';
		logger.error(`PostgresError caught from: ${errorOrigin}`, {
			code: error.code,
			detail: error.detail,
			table: error.table_name,
			constraint: error.constraint_name
		});

		// Create the new error with the original postgres error as the `cause`
		const options = { cause: error };

		switch (error.code) {
			case '23505': // Unique constraint violation
				throw new ServiceError(ERROR_CODES.postgres.UNIQUE_VIOLATION, options);
			case '23502': // Not-null violation
				throw new ServiceError(ERROR_CODES.postgres.NOT_NULL_VIOLATION, options);
			case '42601': // Syntax error
				throw new ServiceError(ERROR_CODES.postgres.SYNTAX_ERROR, options);
			default:
				// For all other DB errors, throw the generic undefined DB error
				throw new ServiceError(ERROR_CODES.postgres.UNDEFINED, options);
		}
	}

	// Handle all other unexpected errors
	logger.error(`An unexpected error was caught from: ${origin || 'Unknown origin'}`, {
		error
	});

	// Wrap the unknown error in a generic internal error, preserving the cause
	throw new ServiceError(ERROR_CODES.generic.INTERNAL_UNDEFINED, {
		cause: error,
		overrideMessage: 'An unexpected internal error occurred. Check server logs for details.'
	});
}
