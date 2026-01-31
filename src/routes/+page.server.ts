import type { PageServerLoad } from './$types';
import { db, schema } from '$lib/server/db';
import _ from 'lodash';
import { sentry } from '$lib/sentry';
import { AppError } from '$lib/errors';

export const load: PageServerLoad = async ({ locals, url }) => {
	let totalAnime: number = 0;
	let error: App.Error | null = null;

	try {
		sentry.addBreadcrumb({ message: 'Fetch total anime' });
		const anime = await db.select().from(schema.anime);
		totalAnime = anime.length;
	} catch (err) {
		if (err instanceof AppError) {
			let context = {};

			if (locals.session?.user.id) {
				_.set(context, 'user.id', locals.session.user.id);
			}

			_.set(context, 'tags.url', url.pathname);

			error = sentry.logServer(err, context);
		} else {
			throw err;
		}
	}

	return { totalAnime, error };
};
