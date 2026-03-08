export interface ErrorCode {
	readonly code: string;
	readonly message: string;
	readonly httpStatus: number;
}

/**
 * Centralised error code catalog.
 *
 * Code prefix → domain:
 *   DB____  Raw database / Drizzle failures
 *   SCH___  Schedule domain (schedules, entries, slots, datecodes)
 *   ANI___  AniList API communication
 *   FORM__  Form processing & submission
 *   AUTH__  Authentication & authorisation
 *   GEN___  Generic / unclassified fallback
 */
export const ERROR_CODES = {
	// ------------------------------------------------------------------ //
	// DB — Raw database failures (Drizzle / PostgreSQL level)             //
	// ------------------------------------------------------------------ //
	db: {
		/** A query failed unexpectedly (e.g. connection lost, syntax error). */
		QUERY_FAILED: {
			code: 'DB001',
			message: 'A database query failed unexpectedly.',
			httpStatus: 500
		},

		/** An insert completed but returned no rows — silent failure. */
		INSERT_FAILED: {
			code: 'DB002',
			message: 'A database insert did not return the expected result.',
			httpStatus: 500
		},

		/** A multi-statement transaction was rolled back. */
		TRANSACTION_FAILED: {
			code: 'DB003',
			message: 'A database transaction failed and was rolled back.',
			httpStatus: 500
		},

		/** INSERT violated a UNIQUE constraint. */
		UNIQUE_VIOLATION: {
			code: 'DB004',
			message: 'This record already exists (unique constraint violation).',
			httpStatus: 409
		},

		/** A required column received NULL. */
		NOT_NULL_VIOLATION: {
			code: 'DB005',
			message: 'Required data is missing (not-null constraint violation).',
			httpStatus: 400
		}
	},

	// ------------------------------------------------------------------ //
	// SCH — Schedule domain errors                                        //
	// ------------------------------------------------------------------ //
	schedule: {
		/** The datecode string (YYYY-WNN) is not a valid format. */
		DATECODE_INVALID: {
			code: 'SCH001',
			message: 'The provided datecode is not a valid week identifier (expected YYYY-WNN).',
			httpStatus: 400
		},

		/** No schedule exists for the requested datecode. */
		NOT_FOUND: {
			code: 'SCH002',
			message: 'Schedule not found for the specified week.',
			httpStatus: 404
		},

		/** A schedule already exists for that datecode — cannot create a duplicate. */
		ALREADY_EXISTS: {
			code: 'SCH003',
			message: 'A schedule already exists for this week.',
			httpStatus: 409
		},

		/** A schedule entry was not found (by ID or datecode lookup). */
		ENTRY_NOT_FOUND: {
			code: 'SCH004',
			message: 'Schedule entry not found.',
			httpStatus: 404
		},

		/** The requested air date falls outside the schedule week's range. */
		ENTRY_DATE_OUT_OF_RANGE: {
			code: 'SCH005',
			message: 'The entry air date is outside the schedule week range.',
			httpStatus: 422
		},

		/** Two entries (or a new entry vs an existing one) conflict on day + time slot. */
		ENTRY_SLOT_CONFLICT: {
			code: 'SCH006',
			message: 'Another entry already occupies this day and time slot.',
			httpStatus: 409
		},

		/** A time slot was not found. */
		SLOT_NOT_FOUND: {
			code: 'SCH007',
			message: 'Time slot not found.',
			httpStatus: 404
		},

		/** Cannot create a slot — day + time combination already exists. */
		SLOT_DUPLICATE: {
			code: 'SCH008',
			message: 'A slot with this day and time already exists.',
			httpStatus: 409
		},

		/** generate-schedule produced no entries (anime/season data missing). */
		GENERATE_NO_ENTRIES: {
			code: 'SCH009',
			message: 'No schedule entries could be generated for this week.',
			httpStatus: 422
		}
	},

	// ------------------------------------------------------------------ //
	// ANI — AniList API errors                                            //
	// ------------------------------------------------------------------ //
	anilist: {
		/** The supplied AniList ID is not a positive integer. */
		INVALID_ID: {
			code: 'ANI001',
			message: 'Invalid AniList ID. It must be a positive integer.',
			httpStatus: 400
		},

		/** TCP/fetch-level failure — could not reach the AniList API. */
		NETWORK_ERROR: {
			code: 'ANI101',
			message: 'A network error occurred while trying to connect to the AniList API.',
			httpStatus: 503
		},

		/** AniList responded with a non-2xx HTTP status. */
		UPSTREAM_HTTP_ERROR: {
			code: 'ANI102',
			message: 'The AniList API returned a non-successful HTTP status code.',
			httpStatus: 502
		},

		/** AniList response body could not be parsed as JSON. */
		MALFORMED_RESPONSE: {
			code: 'ANI103',
			message: 'The AniList API returned a malformed or non-JSON response.',
			httpStatus: 502
		},

		/** AniList returned a GraphQL-level error in the response body. */
		GRAPHQL_ERROR: {
			code: 'ANI104',
			message: 'The AniList API returned a GraphQL error.',
			httpStatus: 502
		}
	},

	// ------------------------------------------------------------------ //
	// FORM — Form processing & action errors                              //
	// ------------------------------------------------------------------ //
	forms: {
		/** Zod / superforms validation failed — user input is invalid. */
		VALIDATION_FAILED: {
			code: 'FORM001',
			message: 'Form validation failed. Please check your input and try again.',
			httpStatus: 400
		},

		/** A required file upload is missing or has an invalid MIME type. */
		FILE_MISSING_OR_INVALID: {
			code: 'FORM002',
			message: 'Required file is missing or invalid.',
			httpStatus: 400
		},

		/** The submitted form body could not be parsed (malformed multipart, etc.). */
		MALFORMED_DATA: {
			code: 'FORM003',
			message: 'Submitted form data is malformed or could not be processed.',
			httpStatus: 400
		},

		/** Duplicate record — the thing being created already exists. */
		DUPLICATE_ENTRY: {
			code: 'FORM004',
			message: 'This entry already exists.',
			httpStatus: 409
		},

		/** Input is structurally valid but logically unprocessable (e.g. length mismatch). */
		LOGIC_MISMATCH: {
			code: 'FORM006',
			message: 'Form input is valid but could not be processed due to a logic mismatch.',
			httpStatus: 422
		},

		/** Action forbidden for this user/role. */
		FORBIDDEN: {
			code: 'FORM007',
			message: 'You do not have permission to perform this action.',
			httpStatus: 403
		},

		/** Catch-all: unexpected error during form processing — should always wrap a cause. */
		INTERNAL_ERROR: {
			code: 'FORM999',
			message: 'An unexpected error occurred while processing the form.',
			httpStatus: 500
		}
	},

	// ------------------------------------------------------------------ //
	// AUTH — Authentication & authorisation                               //
	// ------------------------------------------------------------------ //
	auth: {
		/** Request is unauthenticated (no valid session). */
		UNAUTHORIZED: {
			code: 'AUTH001',
			message: 'You must be logged in to perform this action.',
			httpStatus: 401
		},

		/** Request is authenticated but the user lacks the required permission. */
		FORBIDDEN: {
			code: 'AUTH002',
			message: 'You do not have permission to access this resource.',
			httpStatus: 403
		},

		/** Registration was attempted with an invalid or missing registration code. */
		INVALID_REGISTRATION_CODE: {
			code: 'AUTH003',
			message: 'Invalid registration code.',
			httpStatus: 403
		}
	},

	// ------------------------------------------------------------------ //
	// GEN — Generic / unclassified fallback                               //
	// ------------------------------------------------------------------ //
	generic: {
		/** Catch-all internal error — use a more specific code if one exists. */
		INTERNAL_ERROR: {
			code: 'GEN500',
			message: 'An unexpected internal server error occurred.',
			httpStatus: 500
		},

		/** Generic 404 for resources that don't belong to a specific domain. */
		NOT_FOUND: {
			code: 'GEN404',
			message: 'The requested resource could not be found.',
			httpStatus: 404
		}
	}
} as const;
