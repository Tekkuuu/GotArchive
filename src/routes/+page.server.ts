import type { PageServerLoad } from './$types';
import { services, db, schema, type Changelog } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import _ from 'lodash';
import { sentry } from '$lib/sentry';
import { AppError } from '$lib/errors';

export const load: PageServerLoad = async ({ locals, url }) => {
  let totalAnime: number = 0;
  let totalEpisodesWatched: number = 0;
  let changelogs: Changelog[] = [];
  let error: App.Error | null = null;

  try {
    sentry.addBreadcrumb({ message: 'Fetch total anime' });
    totalAnime = (await services.anime.select(db)).length;
    sentry.addBreadcrumb({ message: 'Fetch total episodes watched' });
    totalEpisodesWatched = (await services.animeEpisode.select(db, eq(schema.animeEpisode.watched, true))).length;
    sentry.addBreadcrumb({ message: 'Fetch latest changelogs' });
    changelogs = await services.changelog.select(db);
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

  return { totalAnime, totalEpisodesWatched, changelogs, error };
}
