export interface ErrorCode {
	readonly code: string;
	readonly message: string;
	readonly httpStatus: number;
}

export const ERROR_CODES = {
	postgres: {
		UNDEFINED: { code: 'DB000', message: 'Undefined database error.', httpStatus: 500 },
		UNIQUE_VIOLATION: { code: 'DB001', message: 'This item already exists.', httpStatus: 409 }, // 409 Conflict
		NOT_NULL_VIOLATION: { code: 'DB002', message: 'Required data is missing.', httpStatus: 400 },
		SYNTAX_ERROR: { code: 'DB003', message: 'A database syntax error occurred.', httpStatus: 500 }
	},
	validation: {
		// 400 Bad Request for general validation failures
		UNDEFINED: { code: 'VAL000', message: 'A general validation error occurred.', httpStatus: 400 },
		UPDATE_GOT_EMPTY_ARRAY: {
			code: 'VAL001',
			message: 'Update operation received an array instead of a single object.',
			httpStatus: 400
		},
		INSERT_GOT_EMPTY_ARRAY: {
			code: 'VAL002',
			message: 'Insert operation received an empty array.',
			httpStatus: 400
		},
		SELECT_EMPTY_ARGS: {
			code: 'VAL003',
			message: 'Select operation received empty arguments.',
			httpStatus: 400
		},
		INVALID_SELECT_FILTERS: {
			code: 'VAL004',
			message: 'Invalid select filters provided.',
			httpStatus: 400
		},
		UPDATE_ARRAY_LENGTH_MISMATCH: {
			code: 'VAL008',
			message: 'Update operation data/id arrays length mismatch.',
			httpStatus: 400
		},
		INVALID_ID: {
			code: 'VAL201',
			message: 'The provided ID has an invalid format.',
			httpStatus: 400
		},
		// 404 Not Found for operations on non-existent items
		UPDATE_AFFECTED_NO_ROWS: {
			code: 'VAL006',
			message: 'The item you tried to update was not found.',
			httpStatus: 404
		},
		DELETE_AFFECTED_NO_ROWS: {
			code: 'VAL007',
			message: 'The item you tried to delete was not found.',
			httpStatus: 404
		},
		// 409 Conflict for business rule violations
		CANNOT_DELETE_SCHEDULED_EPISODES: {
			code: 'VAL010',
			message: 'Cannot delete episodes that are already scheduled.',
			httpStatus: 409
		},
		// 500 Internal Server Error for critical logic failures mistaken as validation
		WHERE_UNDEFINED: {
			code: 'VAL005',
			message: 'A critical query error occurred (where clause was undefined).',
			httpStatus: 500
		},
		SINGLE_UPDATE_AFFECTED_MULTIPLE: {
			code: 'VAL009',
			message: 'A critical update error occurred (single update affected multiple rows).',
			httpStatus: 500
		},
		// Specific entity validation errors (all 400)
		INVALID_ANIME: { code: 'VAL101', message: 'Invalid anime data provided.', httpStatus: 400 },
		INVALID_ANIME_SEASON: {
			code: 'VAL102',
			message: 'Invalid anime season data provided.',
			httpStatus: 400
		},
		INVALID_ANIME_LINK: {
			code: 'VAL103',
			message: 'Invalid anime link data provided.',
			httpStatus: 400
		},
		INVALID_ANIME_GENRE: {
			code: 'VAL104',
			message: 'Invalid anime genre data provided.',
			httpStatus: 400
		},
		INVALID_EPISODE_LINK: {
			code: 'VAL105',
			message: 'Invalid episode link data provided.',
			httpStatus: 400
		},
		INVALID_GENRE: { code: 'VAL106', message: 'Invalid genre data provided.', httpStatus: 400 },
		INVALID_PLATFORM: {
			code: 'VAL107',
			message: 'Invalid platform data provided.',
			httpStatus: 400
		},
		INVALID_SCHEDULE: {
			code: 'VAL108',
			message: 'Invalid schedule data provided.',
			httpStatus: 400
		},
		INVALID_SCHEDULE_ANIME_DETAIL: {
			code: 'VAL109',
			message: 'Invalid schedule anime data provided.',
			httpStatus: 400
		},
		INVALID_SCHEDULE_ANIME_EPISODE: {
			code: 'VAL110',
			message: 'Invalid schedule anime episode data provided.',
			httpStatus: 400
		},
		INVALID_SCHEDULE_ENTRY: {
			code: 'VAL111',
			message: 'Invalid schedule entry data provided.',
			httpStatus: 400
		},
		INVALID_ANIME_EPISODE: {
			code: 'VAL112',
			message: 'Invalid anime episode data provided.',
			httpStatus: 400
		}
	},
	anilist: {
		INVALID_ID: {
			code: 'ANI001',
			message: 'Invalid AniList ID. It must be a positive integer.',
			httpStatus: 400
		},
		// API Communication Errors (5xx)
		NETWORK_ERROR: {
			code: 'ANI101',
			message: 'A network error occurred while trying to connect to the AniList API.',
			httpStatus: 503 // Service Unavailable (our service can't reach its dependency)
		},
		UPSTREAM_HTTP_ERROR: {
			code: 'ANI102',
			message: 'The AniList API returned a non-successful HTTP status code.',
			httpStatus: 502 // Bad Gateway (we got a bad response from upstream)
		},
		MALFORMED_RESPONSE: {
			code: 'ANI103',
			message: 'The AniList API returned a malformed or non-JSON response.',
			httpStatus: 502 // Bad Gateway (upstream sent something unreadable)
		},
		GRAPHQL_ERROR: {
			code: 'ANI104',
			message: 'The AniList API returned a GraphQL error.',
			httpStatus: 502 // Bad Gateway (the request was valid, but the operation failed)
		}
	},
	forms: {
		// 400 Bad Request - Form validation failed (schema, missing required, etc.)
		VALIDATION_FAILED: {
			code: 'FORM001',
			message: 'Form validation failed. Please check your input and try again.',
			httpStatus: 400
		},

		// 400 Bad Request - Required file missing or invalid type
		FILE_MISSING_OR_INVALID: {
			code: 'FORM002',
			message: 'Required file is missing or invalid.',
			httpStatus: 400
		},

		// 400 Bad Request - Form data is malformed (unexpected structure, not parseable, etc.)
		MALFORMED_DATA: {
			code: 'FORM003',
			message: 'Submitted form data is malformed or could not be processed.',
			httpStatus: 400
		},

		// 409 Conflict - Something already exists (duplicate entry, business logic)
		DUPLICATE_ENTRY: {
			code: 'FORM004',
			message: 'This entry already exists.',
			httpStatus: 409
		},

		// 404 Not Found - Referenced data not found (e.g., anime id doesn't exist)
		REFERENCED_RESOURCE_NOT_FOUND: {
			code: 'FORM005',
			message: 'A referenced resource was not found.',
			httpStatus: 404
		},

		// 422 Unprocessable Entity - Logic error (input valid but can't be processed, e.g., length mismatch)
		LOGIC_MISMATCH: {
			code: 'FORM006',
			message: 'Form input is valid but could not be processed due to a logic mismatch.',
			httpStatus: 422
		},

		// 403 Forbidden - Not permitted (user lacks rights, etc. — useful even in admin-only system)
		FORBIDDEN: {
			code: 'FORM007',
			message: 'You do not have permission to perform this action.',
			httpStatus: 403
		},

		// 500 Internal Server Error - Unexpected critical error during form processing
		INTERNAL_ERROR: {
			code: 'FORM999',
			message: 'An unexpected error occurred while processing the form.',
			httpStatus: 500
		}
	},
	generic: {
		INTERNAL_UNDEFINED: {
			code: 'GEN000',
			message: 'An unexpected internal server error occurred.',
			httpStatus: 500
		},
		NOT_FOUND: {
			code: 'GEN404',
			message: 'The requested resource could not be found.',
			httpStatus: 404
		}
	}
} as const;
