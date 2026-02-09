import type { PageServerLoad } from './$types';
import { db, schema } from '$lib/server/db';
import _ from 'lodash';
import { AppError } from '$lib/errors';

export const load: PageServerLoad = async ({ locals, url }) => {
	let totalAnime: number = 0;
	let error: App.Error | null = null;

	try {
		const anime = await db.select().from(schema.anime);
		totalAnime = anime.length;
	} catch (err) {
		if (err instanceof AppError) {
		} else {
			throw err;
		}
	}

	return { totalAnime, error };
};
