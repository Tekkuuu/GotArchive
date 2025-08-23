import type { PageServerLoad, Actions } from './$types';
import { fail, error } from '@sveltejs/kit';
import { db, schema, services } from '$lib/server/db';
import { AppError, ERROR_CODES, FormError, ServiceError } from '$lib/errors';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { updateFormSchema, createFormSchema, deleteFormSchema } from './util';
import { useSchedule, type Schedule } from '$lib/hooks';
import _ from 'lodash';
import { eq, inArray } from 'drizzle-orm';
import { type SentryLoggerOptions, sentry } from '$lib/sentry';
import { computeWatchedAfterDate } from '$lib/util/schedule';

export const load: PageServerLoad = async ({ params }) => {
  const rawSchedule = await useSchedule(params.datecode, { watchedAfter: true });

  if (!rawSchedule.scheduleInfo) {
    error(404, "Schedule not found for the given year and week.");
  }

  const schedule: Schedule = {
    scheduleInfo: rawSchedule.scheduleInfo,
    scheduleEntries: rawSchedule.scheduleEntries,
  }

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
        // Update the schedule entry (minus data, scheduleEntryId, type, platformIds)
        const scheduleEntryData = _.omit(form.data, ['data', 'scheduleEntryId', 'type', 'platformIds']);
        await services.scheduleEntry.update(tx, scheduleEntryData, { scheduleEntryId: form.data.scheduleEntryId });

        // --- PLATFORM UPDATES ---
        // Get current platforms
        const currentPlatforms = await services.scheduleEntryPlatform.select(
          tx,
          eq(schema.scheduleEntryPlatform.scheduleEntryId, form.data.scheduleEntryId)
        );
        const currentPlatformIds = currentPlatforms.map(p => p.platformId);

        const newPlatformIds = form.data.platformIds;

        // Find platforms to add/remove
        const platformsToAdd = _.difference(newPlatformIds, currentPlatformIds);
        const platformsToRemove = _.difference(currentPlatformIds, newPlatformIds);

        // Remove old platform associations
        if (platformsToRemove.length > 0) {
          await services.scheduleEntryPlatform.delete(
            tx,
            platformsToRemove.map(platformId => ({
              scheduleEntryId: form.data.scheduleEntryId,
              platformId,
            }))
          );
        }

        // Add new platform associations
        if (platformsToAdd.length > 0) {
          await services.scheduleEntryPlatform.insert(
            tx,
            platformsToAdd.map(platformId => ({
              scheduleEntryId: form.data.scheduleEntryId,
              platformId,
            }))
          );
        }

        // --- ANIME TYPE LOGIC ---
        switch (form.data.type) {
          case 'anime':
            // Get original anime schedule detail (for scheduleAnimeDetailId)
            const originalScheduleAnimeDetail = await services.scheduleAnimeDetail.select(
              tx,
              eq(schema.scheduleAnimeDetail.scheduleEntryId, form.data.scheduleEntryId)
            );

            if (originalScheduleAnimeDetail.length !== 1) {
              throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'update-schedule-entry' })
            }

            // Update watchedAfter if changed
            const watchedAfter = computeWatchedAfterDate(form.data.date, form.data.time, form.data.data.watchedAfter);
            if (!watchedAfter) {
              throw new FormError(ERROR_CODES.forms.VALIDATION_FAILED);
            }
            if (watchedAfter && watchedAfter !== originalScheduleAnimeDetail[0].watchedAfter) {
              await services.scheduleAnimeDetail.update(
                tx,
                { watchedAfter },
                { scheduleAnimeDetailId: originalScheduleAnimeDetail[0].scheduleAnimeDetailId }
              );
            }

            // Get original schedule anime episodes (for animeEpisodeId)
            const originalScheduleAnimeEpisodes = await services.scheduleAnimeEpisode.select(
              tx,
              eq(schema.scheduleAnimeEpisode.scheduleAnimeDetailId, originalScheduleAnimeDetail[0].scheduleAnimeDetailId)
            );

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
              // Anime was changed: verify and update
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

              // Remove all old, insert all new
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
              // Anime not changed: diff and update
              const originalIds = originalEpisodes.map(ep => ep.animeEpisodeId);
              const newIds = form.data.data.animeEpisodeIds;
              const deleted = _.difference(originalIds, newIds);
              const added = _.difference(newIds, originalIds);

              if (deleted.length > 0) {
                await services.scheduleAnimeEpisode.delete(
                  tx,
                  deleted.map(deleteEpId => ({
                    animeEpisodeId: deleteEpId,
                    scheduleAnimeDetailId: originalScheduleAnimeDetail[0].scheduleAnimeDetailId
                  }))
                );
              }

              if (added.length > 0) {
                await services.scheduleAnimeEpisode.insert(
                  tx,
                  added.map(addedEpiId => ({
                    animeEpisodeId: addedEpiId,
                    scheduleAnimeDetailId: originalScheduleAnimeDetail[0].scheduleAnimeDetailId
                  }))
                );
              }

              // If after delete/add the entry has no episodes, return fail
              const newState = await services.scheduleAnimeEpisode.select(
                tx,
                eq(schema.scheduleAnimeEpisode.scheduleAnimeDetailId, originalScheduleAnimeDetail[0].scheduleAnimeDetailId)
              );

              if (newState.length === 0) {
                throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'update-schedule-entry' })
              }
            }
            break;
          case 'misc':
            let smdid = await services.scheduleMiscDetail.select(tx, eq(schema.scheduleMiscDetail.scheduleEntryId, form.data.scheduleEntryId));
            if (smdid.length !== 1) {
              throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'update-schedule-entry' })
            }
            await services.scheduleMiscDetail.update(
              tx,
              {
                title: form.data.data.title,
                description: form.data.data.description
              },
              { scheduleMiscDetailId: smdid[0].scheduleMiscDetailId }
            );
            break;
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
      await db.transaction(async (tx) => {
        // 1. Insert schedule entry (base row)
        const [scheduleEntryInserted] = await services.scheduleEntry.insert(tx, [{
          scheduleId: form.data.scheduleId,
          type: form.data.type,
          date: form.data.date,
          time: form.data.time,
          note: form.data.note
        }]);

        if (!scheduleEntryInserted) {
          throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'create-schedule-entry' });
        }

        // 2. Insert platform associations (join table)
        if (form.data.platformIds.length > 0) {
          const scheduleEntryPlatformRows = form.data.platformIds.map(platformId => ({
            scheduleEntryId: scheduleEntryInserted.scheduleEntryId,
            platformId
          }));
          await services.scheduleEntryPlatform.insert(tx, scheduleEntryPlatformRows);
        }

        // 3. If type is anime, insert detail and episode info
        switch (form.data.type) {
          case 'anime':
            const watchedAfter = computeWatchedAfterDate(
              form.data.date,
              form.data.time,
              form.data.data.watchedAfter
            );

            if (!watchedAfter) {
              throw new FormError(ERROR_CODES.forms.VALIDATION_FAILED, { form: 'create-schedule-entry' });
            }

            // Insert anime detail
            const [animeDetailInserted] = await services.scheduleAnimeDetail.insert(tx, [{
              scheduleEntryId: scheduleEntryInserted.scheduleEntryId,
              watchedAfter
            }]);

            if (!animeDetailInserted) {
              throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'create-schedule-entry' });
            }

            // Validate all episode IDs exist
            const animeEpisodes = await services.animeEpisode.select(
              tx,
              inArray(schema.animeEpisode.animeEpisodeId, form.data.data.animeEpisodeIds)
            );
            if (animeEpisodes.length !== form.data.data.animeEpisodeIds.length) {
              throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, { form: 'create-schedule-entry' });
            }

            // Insert anime episodes join rows
            const animeEpisodeRows = animeEpisodes.map(ep => ({
              animeEpisodeId: ep.animeEpisodeId,
              scheduleAnimeDetailId: animeDetailInserted.scheduleAnimeDetailId
            }));
            if (animeEpisodeRows.length > 0) {
              await services.scheduleAnimeEpisode.insert(tx, animeEpisodeRows);
            }
            break;
          case 'misc':
            await services.scheduleMiscDetail.insert(
              tx,
              {
                scheduleEntryId: scheduleEntryInserted.scheduleEntryId,
                title: form.data.data.title,
                description: form.data.data.description
              }
            );
            break;
        }
      });

      return { form };
    } catch (err) {
      let context: SentryLoggerOptions = {
        tags: {
          url: url.pathname,
          form: 'create-schedule-entry',
        }
      }
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
