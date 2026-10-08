import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Never expose the raw session token (a bearer secret) to the client.
	const session = locals.session
		? { ...locals.session, session: { ...locals.session.session, token: undefined } }
		: null;

	return {
		session,
		user: locals.user
	};
};
