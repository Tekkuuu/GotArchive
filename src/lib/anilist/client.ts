import { AnilistError, ERROR_CODES } from '$lib/errors';
import _ from 'lodash';

const ANILIST_API_URL = 'https://graphql.anilist.co';

/**
 * A reusable and robust function to make GraphQL requests to the AniList API.
 *
 * @param query - The GraphQL query string.
 * @param variables - An optional record of variables for the query.
 * @returns A promise resolving to the parsed response data of type `T`.
 */
export async function fetchGraphQL<T>(query: string, variables?: Record<string, any>): Promise<T> {
	// Construct the base request body.
	const body: { query: string; variables?: Record<string, any> } = { query };

	// Only add the 'variables' key if it's provided and not empty.
	if (!_.isEmpty(variables)) {
		body.variables = variables;
	}

	let response: Response;

	try {
		response = await fetch(ANILIST_API_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify(body) // The body is now conditionally structured.
		});
	} catch (error) {
		throw new AnilistError(ERROR_CODES.anilist.NETWORK_ERROR, {
			cause: error,
			details: { reason: 'Fetch failed due to a network error.', variables }
		});
	}

	if (!response.ok) {
		throw new AnilistError(ERROR_CODES.anilist.UPSTREAM_HTTP_ERROR, {
			details: { httpStatus: response.status, statusText: response.statusText, variables }
		});
	}

	let json;

	try {
		json = await response.json();
	} catch (error) {
		throw new AnilistError(ERROR_CODES.anilist.MALFORMED_RESPONSE, {
			cause: error,
			details: { httpStatus: response.status }
		});
	}

	if (json.errors) {
		throw new AnilistError(ERROR_CODES.anilist.GRAPHQL_ERROR, {
			details: { graphqlErrors: json.errors, variables }
		});
	}

	return json.data as T;
}
