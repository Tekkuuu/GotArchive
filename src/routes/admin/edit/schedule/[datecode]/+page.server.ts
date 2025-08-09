import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { db, schema, services } from '$lib/server/db';
import { AppError, ERROR_CODES, FormError, ServiceError } from '$lib/errors';
import logger from '$lib/logger';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { updateFormSchema, createFormSchema, deleteFormSchema } from './util';
import { useSchedule } from '$lib/hooks';
import _ from 'lodash';
import { eq, inArray } from 'drizzle-orm';
import { type SentryLoggerOptions, sentry } from '$lib/sentry';
import { url } from 'zod/v4';

export const load: PageServerLoad = async ({ params }) => {
  const schedule = await useSchedule(params.datecode);
  const scheduleEntryType = schema.typeScheduleEntry.enumValues;
  const anime = await services.anime.select(db);
  const platforms = await services.platform.select(db);

  const updateForm = await superValidate(zod4(updateFormSchema));
  const createForm = await superValidate(zod4(createFormSchema));
  const deleteForm = await superValidate(zod4(deleteFormSchema));

  return {
    schedule,
    scheduleEntryType,
    anime,
    platforms,
    updateForm,
    createForm,
    deleteForm,
  }
}

export const actions: Actions = {
  update: async ({ request, locals, url }) => {
    const form = await superValidate(request, zod4(updateFormSchema));

    try {
      await db.transaction(async (tx) => {
        // Update the schedule entry
        const scheduleEntryData = _.omit(form.data, ['data', 'scheduleEntryId', 'type']);
        await services.scheduleEntry.update(tx, scheduleEntryData, { scheduleEntryId: form.data.scheduleEntryId });

        // If type is 'anime'
        if (form.data.type === 'anime') {
          // Get orignal anime schedule detail (for scheduleAnimeDetailId)
          const originalScheduleAnimeDetail = await services.scheduleAnimeDetail.select(
            tx,
            eq(schema.scheduleAnimeDetail.scheduleEntryId, form.data.scheduleEntryId)
          );

          if (originalScheduleAnimeDetail.length !== 1) {
            throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'update-schedule-entry' })
          }

          // Get original schedule anime episodes (for animeEpisodeId)
          const originalScheduleAnimeEpisodes = await services.scheduleAnimeEpisode.select(
            tx,
            eq(schema.scheduleAnimeEpisode.scheduleAnimeDetailId, originalScheduleAnimeDetail[0].scheduleAnimeDetailId)
          );

          if (originalScheduleAnimeEpisodes.length === 0) {
            throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'update-schedule-entry' })
          }

          // Get actual animeEpisode row matching animeEpisodeIds from schjeduleAnimeEpisodes
          const originalEpisodes = await services.animeEpisode.select(
            tx,
            inArray(schema.animeEpisode.animeEpisodeId, originalScheduleAnimeEpisodes.map(ep => ep.animeEpisodeId))
          );

          if (originalEpisodes.length === 0) {
            throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'update-schedule-entry' })
          } else if (!_.every(originalEpisodes, ['animeId', originalEpisodes[0].animeId])) {
            throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'update-schedule-entry' })
          }

          if (originalEpisodes[0].animeId !== form.data.data.animeId) {
            // Anime was changed
            // If form contains episodes from old anime, fail
            const newAnimeEpisodes = await services.animeEpisode.select(
              tx,
              inArray(schema.animeEpisode.animeEpisodeId, form.data.data.animeEpisodeIds)
            );

            if (newAnimeEpisodes.length !== form.data.data.animeEpisodeIds.length) {
              throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'update-schedule-entry' })
            }

            if (!_.every(newAnimeEpisodes, ['animeId', form.data.data.animeId])) {
              throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'update-schedule-entry' })
            }

            // New episodes are correct, delete old episodes, insert new episodes
            await services.scheduleAnimeEpisode.delete(
              tx,
              originalScheduleAnimeEpisodes
            );

            await services.scheduleAnimeEpisode.insert(
              tx,
              newAnimeEpisodes.map(addedEpi => ({
                animeEpisodeId: addedEpi.animeEpisodeId,
                scheduleAnimeDetailId: originalScheduleAnimeDetail[0].scheduleAnimeDetailId
              }))
            );
          } else {
            // Anime was not changed, check if episodes were added or deleted
            const originalIds = originalEpisodes.map(ep => ep.animeEpisodeId);
            const newIds = form.data.data.animeEpisodeIds;
            const deleted = _.difference(originalIds, newIds);
            const added = _.difference(newIds, originalIds);

            if (deleted.length > 0) {
              // Delete old episodes
              await services.scheduleAnimeEpisode.delete(
                tx,
                deleted.map(deleteEpId => ({
                  animeEpisodeId: deleteEpId,
                  scheduleAnimeDetailId: originalScheduleAnimeDetail[0].scheduleAnimeDetailId
                }))
              );
            }

            // Add new episodes
            if (added.length > 0) {
              await services.scheduleAnimeEpisode.insert(
                tx,
                added.map(addedEpiId => ({
                  animeEpisodeId: addedEpiId,
                  scheduleAnimeDetailId: originalScheduleAnimeDetail[0].scheduleAnimeDetailId
                }))
              );
            }

            // If after delete/add the entry has no episodes, return fail, potentialy prompt to delete entry
            const newState = await services.scheduleAnimeEpisode.select(
              tx,
              eq(schema.scheduleAnimeEpisode.scheduleAnimeDetailId, originalScheduleAnimeDetail[0].scheduleAnimeDetailId)
            );

            if (newState.length === 0) {
              throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'update-schedule-entry' })
            }
          }
        }
      });

      return { form };
    } catch (err) {
      let context: SentryLoggerOptions = {
        tags: {
          url: url.pathname,
          form: 'update-schedule-entry',
        }
      }
      const userId = locals.session?.user.id;
      if (userId) _.set(context, 'user.id', userId);
      sentry.logServer(err, context);

      if (err instanceof AppError) {
        return fail(err.httpStatus, { form, text: err.message })
      } else if (err instanceof Error) {
        return fail(500, { form, text: err.message })
      } else {
        return fail(500, { form, text: 'Unexpected error occurred' });
      }
    }
  },
  create: async ({ request, url, locals }) => {
    const form = await superValidate(request, zod4(createFormSchema));

    if (!form.valid) {
      return fail(400, { form, message: "Form validation failed." });
    }

    try {
      db.transaction(async (tx) => {
        const scheduleEntryInserted = await services.scheduleEntry.insert(tx, {
          ..._.omit(form.data, ['data']),
        });

        if (scheduleEntryInserted.length !== 1) {
          throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'create-schedule-entry' });
        }

        if (form.data.type === 'anime') {
          const scheduleAnimeDetailInserted = await services.scheduleAnimeDetail.insert(tx, {
            scheduleEntryId: scheduleEntryInserted[0].scheduleEntryId
          });

          if (scheduleAnimeDetailInserted.length !== 1) {
            throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'create-schedule-entry' });
          }

          const animeEpisodes = await services.animeEpisode.select(
            tx,
            inArray(schema.animeEpisode.animeEpisodeId, form.data.data.animeEpisodeIds)
          );

          if (animeEpisodes.length !== form.data.data.animeEpisodeIds.length) {
            throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'create-schedule-entry' });
          }

          await services.scheduleAnimeEpisode.insert(
            tx,
            animeEpisodes.map(ep => ({
              animeEpisodeId: ep.animeEpisodeId,
              scheduleAnimeDetailId: scheduleAnimeDetailInserted[0].scheduleAnimeDetailId
            }))
          );
        }
      });

      return { form };
    } catch (err) {
      let context: SentryLoggerOptions = {
        tags: {
          url: url.pathname,
          form: 'create-schedule',
        }
      }
      const userId = locals.session?.user.id;
      if (userId) _.set(context, 'user.id', userId);
      sentry.logServer(err, context);

      if (err instanceof AppError) {
        return fail(err.httpStatus, { form, text: err.message })
      } else if (err instanceof Error) {
        return fail(500, { form, text: err.message })
      } else {
        return fail(500, { form, text: 'Unexpected error occurred' });
      }
    }
  },
  delete: async ({ request, locals, url }) => {
    const form = await superValidate(request, zod4(deleteFormSchema));

    if (!form.valid) {
      return fail(400, { form, message: "Form validation failed." });
    }

    try {
      await db.transaction(async (tx) => {
        await services.scheduleEntry.delete(
          tx,
          { scheduleEntryId: form.data.scheduleEntryId }
        )
      });

      return { form };
    } catch (err) {
      let context: SentryLoggerOptions = {
        tags: {
          url: url.pathname,
          form: 'delete-schedule-entry',
        }
      }
      const userId = locals.session?.user.id;
      if (userId) _.set(context, 'user.id', userId);
      sentry.logServer(err, context);

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
