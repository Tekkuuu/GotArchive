import type { ErrorCode } from './codes';

export interface AppErrorOptions {
	cause?: unknown;
	context?: Record<string, unknown>;
}

/**
 * Error domain, inferred from the code prefix:
 *
 *   DB____  → 'db'       Raw database / Drizzle failures
 *   SCH___  → 'schedule' Schedule domain (schedules, entries, slots, datecodes)
 *   ANI___  → 'anilist'  AniList API communication
 *   FORM__  → 'form'     Form processing & submission
 *   AUTH__  → 'auth'     Authentication & authorisation
 *   GEN___  → 'generic'  Unclassified fallback
 */
export type AppErrorDomain = 'db' | 'schedule' | 'anilist' | 'form' | 'auth' | 'generic';

/**
 * Unified application error.
 *
 * Wrap every server-side failure in an AppError so that `handleError` in
 * hooks.server.ts can log a consistently structured payload to BetterStack.
 *
 * @example
 * ```typescript
 * // Database failure
 * throw new AppError(ERROR_CODES.db.TRANSACTION_FAILED, {
 *   cause: drizzleError,
 *   context: { operation: 'insertScheduleEntries', week: datecode }
 * });
 *
 * // Domain / business logic error
 * throw new AppError(ERROR_CODES.schedule.ALREADY_EXISTS, {
 *   context: { datecode }
 * });
 *
 * // External API failure
 * throw new AppError(ERROR_CODES.anilist.NETWORK_ERROR, {
 *   cause: fetchError,
 *   context: { variables }
 * });
 *
 * // Form action catch-all
 * throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
 *   cause: unknownError,
 *   context: { action: 'createAnime' }
 * });
 * ```
 */
export class AppError extends Error {
	/** Machine-readable error code (e.g. `'SCH003'`). */
	public readonly code: string;

	/** High-level domain the error belongs to — useful for log filtering. */
	public readonly domain: AppErrorDomain;

	/** HTTP status code to return to the client. */
	public readonly httpStatus: number;

	/** ISO-8601 timestamp at the moment the error was constructed. */
	public readonly timestamp: string;

	/**
	 * Arbitrary key/value bag for structured logging.
	 * Always include identifiers relevant to the failing operation
	 * (e.g. `datecode`, `animeId`, `action`, `table`).
	 */
	public readonly context: Record<string, unknown>;

	/** The original error that caused this one (supports native error chaining). */
	public readonly cause: unknown;

	constructor(errorCode: ErrorCode, options: AppErrorOptions = {}) {
		super(errorCode.message, { cause: options.cause });

		this.name = 'AppError';
		this.code = errorCode.code;
		this.httpStatus = errorCode.httpStatus;
		this.timestamp = new Date().toISOString();
		this.context = options.context ?? {};
		this.cause = options.cause;
		this.domain = AppError.inferDomain(errorCode.code);

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	/**
	 * Infer the error domain from the code prefix.
	 * Keeps domain assignment in one place — no need to pass it manually.
	 */
	private static inferDomain(code: string): AppErrorDomain {
		if (code.startsWith('DB')) return 'db';
		if (code.startsWith('SCH')) return 'schedule';
		if (code.startsWith('ANI')) return 'anilist';
		if (code.startsWith('FORM')) return 'form';
		if (code.startsWith('AUTH')) return 'auth';
		return 'generic';
	}

	/**
	 * Serialise to a flat object for structured logging (BetterStack / Winston).
	 * All fields are top-level so they can be indexed and queried directly.
	 */
	toJSON(): Record<string, unknown> {
		const result: Record<string, unknown> = {
			name: this.name,
			code: this.code,
			domain: this.domain,
			message: this.message,
			httpStatus: this.httpStatus,
			timestamp: this.timestamp,
			context: this.context,
			stack: this.stack
		};

		if (this.cause !== undefined) {
			result.cause = AppError.formatCause(this.cause);
		}

		return result;
	}

	/** Normalise the cause value so it serialises cleanly in logs. */
	private static formatCause(cause: unknown): unknown {
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
