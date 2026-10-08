import { AppError, ERROR_CODES } from '$lib/errors';

const ANILIST_API_URL = 'https://graphql.anilist.co';

/**
 * Sends GraphQL request.
 * @param query - Query string.
 * @param variables - Query variables.
 * @returns Response data.
 */
export async function fetchGraphQL<T>(
	query: string,
	variables?: Record<string, unknown>
): Promise<T> {
	const body: { query: string; variables?: Record<string, unknown> } = { query };
	if (variables && Object.keys(variables).length > 0) {
		body.variables = variables;
	}

	let response: Response;

	try {
		response = await fetch(ANILIST_API_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify(body)
		});
	} catch (error) {
		throw new AppError(ERROR_CODES.anilist.NETWORK_ERROR, {
			cause: error,
			context: { reason: 'Fetch failed due to a network error.', variables }
		});
	}

	if (!response.ok) {
		throw new AppError(ERROR_CODES.anilist.UPSTREAM_HTTP_ERROR, {
			context: { httpStatus: response.status, statusText: response.statusText, variables }
		});
	}

	let json;

	try {
		json = await response.json();
	} catch (error) {
		throw new AppError(ERROR_CODES.anilist.MALFORMED_RESPONSE, {
			cause: error,
			context: { httpStatus: response.status }
		});
	}

	if (json.errors) {
		throw new AppError(ERROR_CODES.anilist.GRAPHQL_ERROR, {
			context: { graphqlErrors: json.errors, variables }
		});
	}

	return json.data as T;
}
