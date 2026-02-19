import type { PageServerLoad } from './$types';
import { db, schema } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	const anime = await db.select().from(schema.anime);

	return { anime };
};
