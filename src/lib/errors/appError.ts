import type { ErrorCode } from './codes';

export interface AppErrorOptions {
	cause?: unknown;
	context?: Record<string, unknown>;
}

/**
 * Unified application error class that replaces ServiceError, FormError, and AnilistError.
 *
 * This class provides a flat structure optimized for logging to BetterStack,
 * with top-level fields that are easy to query and filter.
 *
 * @example
 * ```typescript
 * import { AppError, ERROR_CODES } from '$lib/errors';
 *
 * // Service error
 * throw new AppError(ERROR_CODES.postgres.UNIQUE_VIOLATION, {
 *   cause: originalError,
 *   context: { tableName: 'users' }
 * });
 *
 * // Form error
 * throw new AppError(ERROR_CODES.forms.VALIDATION_FAILED, {
 *   context: { form: 'login', field: 'email' }
 * });
 *
 * // Anilist error
 * throw new AppError(ERROR_CODES.anilist.NETWORK_ERROR, {
 *   cause: fetchError,
 *   context: { animeId: 12345 }
 * });
 * ```
 */
export class AppError extends Error {
	// Error identification
	public readonly code: string;
	public readonly type: 'service' | 'form' | 'anilist' | 'generic';

	// HTTP context
	public readonly httpStatus: number;

	// Temporal context
	public readonly timestamp: string;

	// Additional context (domain-specific data)
	public readonly context: Record<string, unknown>;

	// Original error (for error chaining)
	public readonly cause: unknown;

	/**
	 * @param errorCode - The predefined error code object from ERROR_CODES
	 * @param options - Optional parameters including cause and context
	 */
	constructor(errorCode: ErrorCode, options: AppErrorOptions = {}) {
		super(errorCode.message, { cause: options.cause });

		this.name = 'AppError';
		this.code = errorCode.code;
		this.httpStatus = errorCode.httpStatus;
		this.timestamp = new Date().toISOString();
		this.context = options.context || {};
		this.cause = options.cause;

		// Infer error type from error code prefix
		if (this.code.startsWith('DB') || this.code.startsWith('VAL')) {
			this.type = 'service';
		} else if (this.code.startsWith('FORM')) {
			this.type = 'form';
		} else if (this.code.startsWith('ANI')) {
			this.type = 'anilist';
		} else {
			this.type = 'generic';
		}

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	/**
	 * Convert error to a plain object for logging.
	 * This structure is optimized for BetterStack queries.
	 */
	toJSON() {
		const result: Record<string, any> = {
			name: this.name,
			message: this.message,
			code: this.code,
			type: this.type,
			httpStatus: this.httpStatus,
			timestamp: this.timestamp,
			context: this.context,
			stack: this.stack
		};

		if (this.cause) {
			result.cause = this.formatCause(this.cause);
		}

		return result;
	}

	/**
	 * Format the cause for logging (handles Error objects and unknown types)
	 */
	private formatCause(cause: unknown): any {
		if (cause instanceof Error) {
			return {
				name: cause.name,
				message: cause.message,
				stack: cause.stack
			};
		}
		return cause;
	}
}
