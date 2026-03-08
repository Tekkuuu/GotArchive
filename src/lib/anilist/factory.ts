import { fetchGraphQL } from './client';

/**
 * Configuration for a new API method.
 * @template TInput The type of the input argument for the method.
 * @template TResult The final, transformed data type to be returned.
 * @template TApiResponse The raw data shape returned by the GraphQL API.
 */
interface ApiMethodConfig<TInput, TResult, TApiResponse> {
	query: string | ((input: TInput) => string);
	validate?: (input: TInput) => void;
	mapInputToVariables: (input: TInput) => Record<string, any> | undefined;
	transformResponse: (response: TApiResponse) => TResult;
}

/**
 * A factory function that creates a standardized, reusable, and type-safe method
 * for interacting with the AniList GraphQL API.
 *
 * @param config The configuration object defining the API method.
 * @returns An async function that takes an input and returns the transformed result.
 */
export function createApiMethod<TInput, TResult, TApiResponse>(
	config: ApiMethodConfig<TInput, TResult, TApiResponse>
) {
	return async (input: TInput): Promise<TResult> => {
		//  Validate Input
		config.validate?.(input);

		// Prepare Query and Variables
		const query = typeof config.query === 'function' ? config.query(input) : config.query;
		const variables = config.mapInputToVariables(input);

		// Execute Query
		const response = await fetchGraphQL<TApiResponse>(query, variables);

		// Transform Response
		return config.transformResponse(response);
	};
}
