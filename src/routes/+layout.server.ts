import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, locals }) => {
	return {
		cookies: cookies.getAll(),
		session: locals.session || null
	};
};
