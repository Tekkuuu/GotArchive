import { ERROR_CODES, FormError, AppError } from '$lib/errors';
import { sentry, type SentryLoggerOptions } from '$lib/sentry';
import { db, schema, services } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import _ from 'lodash';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { formSchema } from './util';

export const load: PageServerLoad = async ({ request }) => {
  sentry.addBreadcrumb({ message: "Select anime seasons" });
  const animeSeasons = await services.animeSeason.select(db);
  sentry.addBreadcrumb({ message: "Select anime" });
  const anime = await services.anime.select(db);
  const seasons = schema.typeSeason.enumValues;
  const formats = schema.typeFormat.enumValues;
  sentry.addBreadcrumb({ message: "Select anime formats" });
  const platforms = await services.platform.select(db);

  sentry.addBreadcrumb({ message: "Form creation" });
  const form = await superValidate(zod(formSchema));

  return { animeSeasons, platforms, anime, seasons, formats, form }
}

export const actions: Actions = {
  create: async ({ request, url, locals }) => {
    const form = await superValidate(request, zod(formSchema));

    if (!form.valid) {
      return fail(400, { form, text: ERROR_CODES.forms.VALIDATION_FAILED.message });
    }

    try {
      await db.transaction(async (tx) => {
        await services.animeSeason.insert(tx, _.omit(form.data, ['episodeData']));

        let episodeData: Array<typeof schema.animeEpisode.$inferInsert> = [];
        for (let e of form.data.episodeData) {
          episodeData.push({
            animeId: form.data.animeId,
            sequence: form.data.sequence,
            episodeNumber: e.episodeNumber,
            watched: e.watched || false
          })
        }

        const animeEpisodeInsertedRows = await services.animeEpisode.insert(tx, episodeData);

        let linksData: Array<typeof schema.episodeLink.$inferInsert> = [];

        for (let e of form.data.episodeData) {
          for (let l of e.links) {
            linksData.push({
              animeEpisodeId: animeEpisodeInsertedRows.find(i => i.episodeNumber === e.episodeNumber)?.animeEpisodeId || -1,
              url: l.url,
              platformId: l.platformId,
              note: l.note
            });
          }
        }

        if (_.some(linksData, { animeEpisodeId: -1 })) {
          throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'new-animeseason' });
        }

        if (linksData.length > 0) {
          await services.episodeLink.insert(tx, linksData);
        }
      });
    } catch (err) {
      if (!(err instanceof FormError)) {
        let context: SentryLoggerOptions = {
          tags: {
            url: url.pathname,
            form: 'new-animeseason',
          }
        }
        sentry.logServer(err, context);
      }

      if (err instanceof AppError) {
        return fail(err.httpStatus, { form, text: err.message })
      } else if (err instanceof Error) {
        return fail(500, { form, text: err.message })
      } else {
        return fail(500, { form, text: 'Unexpected error occurred' });
      }
    }
  },
}
