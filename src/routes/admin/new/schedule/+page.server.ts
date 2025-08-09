import type { PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { formSchema } from './util';
import { zod4 } from 'sveltekit-superforms/adapters';
import { db, schema, services } from '$lib/server/db';
import { ERROR_CODES, FormError, AppError } from '$lib/errors';
import { fail } from '@sveltejs/kit';
import _ from 'lodash';
import { sentry, type SentryLoggerOptions } from '$lib/sentry';

export const load: PageServerLoad = async ({ request }) => {
  const form = await superValidate(zod4(formSchema));

  const scheduleEntryType = schema.typeScheduleEntry.enumValues;

  const anime = await services.anime.select(db);

  const platforms = await services.platform.select(db);

  return { anime, platforms, scheduleEntryType, form };
}

export const actions = {
  create: async ({ request, url, locals }) => {
    const form = await superValidate(request, zod4(formSchema));

    if (!form.valid) {
      return fail(422, { form, text: ERROR_CODES.forms.VALIDATION_FAILED });
    }

    try {
      await db.transaction(async (tx) => {
        // Insert schedule and get the id back
        const scheduleInsertedRows = await services.schedule.insert(tx, form.data.schedule);
        const scheduleId = scheduleInsertedRows.at(0)?.scheduleId;

        if (scheduleId === undefined) {
          throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'new-schedule' });
        }

        let scheduleEntryData: typeof schema.scheduleEntry.$inferInsert[] = [];

        // Prepare sorted data to insert schedule entry
        const sortedEntries = _.sortBy(form.data.entries, ['type', 'datetime', 'platformId'])

        for (let entry of sortedEntries) {
          scheduleEntryData.push({
            scheduleId: scheduleId,
            type: entry.type,
            date: entry.date,
            time: entry.time,
            platformId: entry.platformId,
            note: entry.note
          });
        }

        let scheduleEntryInsertedRows = await services.scheduleEntry.insert(tx, scheduleEntryData);

        // Sort received data the same way as scheduleEntryData
        scheduleEntryInsertedRows = _.sortBy(scheduleEntryInsertedRows, ['type', 'datetime', 'platformId']);

        if (sortedEntries.length !== scheduleEntryInsertedRows.length) {
          throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'new-schedule' });
        }

        let scheduleAnimeDetailData: Array<typeof schema.scheduleAnimeDetail.$inferInsert> = [];
        for (let i = 0; i < sortedEntries.length; i++) {
          scheduleAnimeDetailData.push({
            scheduleEntryId: scheduleEntryInsertedRows[i].scheduleEntryId,
          })
        }

        const scheduleAnimeDetailInsertedRows = await services.scheduleAnimeDetail.insert(tx, scheduleAnimeDetailData);

        let scheduleAnimeEpisodeData: Array<typeof schema.scheduleAnimeEpisode.$inferInsert> = [];

        // Iterate through sorted entries to maintain the same order
        for (let i = 0; i < sortedEntries.length; i++) {
          const entry = sortedEntries[i];

          // Find the corresponding scheduleAnimeDetail row by matching both animeId and scheduleEntryId
          const scheduleAnimeDetail = scheduleAnimeDetailInsertedRows.find(
            detail =>
              detail.scheduleEntryId === scheduleEntryInsertedRows[i].scheduleEntryId // Match scheduleEntryId as additional criteria
          );

          // Fail if no matching scheduleAnimeDetail is found
          if (!scheduleAnimeDetail) {
            throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'new-schedule' });
          }

          // Add animeEpisodeIds for the matched scheduleAnimeDetailId
          for (let ep of entry.data.animeEpisodeIds) {
            scheduleAnimeEpisodeData.push({
              scheduleAnimeDetailId: scheduleAnimeDetail.scheduleAnimeDetailId, // Use the matched scheduleAnimeDetailId
              animeEpisodeId: ep,
            });
          }
        }

        // Insert the scheduleAnimeEpisode data
        const scheduleAnimeEpisodeInsertedRows = await services.scheduleAnimeEpisode.insert(
          tx,
          scheduleAnimeEpisodeData
        );

        return { form }
      });
    } catch (err) {
      if (!(err instanceof FormError)) {
        let context: SentryLoggerOptions = {
          tags: {
            url: url.pathname,
            form: 'new-schedule',
          }
        }
        const userId = locals.session?.user.id;
        if (userId) _.set(context, 'user.id', userId);
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
  }
}
