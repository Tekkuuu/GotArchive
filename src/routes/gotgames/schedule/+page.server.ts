import type { PageServerLoad } from './$types';
import { db, schema } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	const platforms = await db.select().from(schema.platform);

	return { platforms };
};
