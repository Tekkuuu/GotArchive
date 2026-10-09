import type { PageServerLoad } from './$types';
import { db, schema, asc } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	const targets = await db
		.select()
		.from(schema.discordTarget)
		.orderBy(asc(schema.discordTarget.label));

	return { targets };
};
