import type { Actions, PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { formSchema, uniqueKey } from './util';
import { computeWatchedAfterDate } from '$lib/util/schedule';
import { zod } from 'sveltekit-superforms/adapters';
import { db, schema, services } from '$lib/server/db';
import { ERROR_CODES, FormError, AppError } from '$lib/errors';
import { fail } from '@sveltejs/kit';
import _ from 'lodash';
import { sentry, type SentryLoggerOptions } from '$lib/sentry';

export const load: PageServerLoad = async ({ request }) => {
	const form = await superValidate(zod(formSchema));

	const scheduleEntryType = schema.typeScheduleEntry.enumValues;

	const anime = await services.anime.select(db);

	const platforms = await services.platform.select(db);

	return { anime, platforms, scheduleEntryType, form };
};

export const actions: Actions = {
	create: async ({ request, url, locals }) => {
		const form = await superValidate(request, zod(formSchema));

		if (!form.valid) {
			return fail(422, { form, text: ERROR_CODES.forms.VALIDATION_FAILED });
		}

		// 1. DE-DUPLICATE entries first
		const entries = _.uniqBy(form.data.entries, uniqueKey);

		// 2. Fail early if duplicates found
		if (entries.length !== form.data.entries.length) {
			return fail(422, { form, text: 'Found duplicate entries in schedule form.' });
		}

		// 3. Sort for stable mapping
		const sortedEntries = _.sortBy(entries, ['type', 'date', 'time']);

		try {
			await db.transaction(async (tx) => {
				// 4. Insert schedule and get the id back
				const scheduleInsertedRows = await services.schedule.insert(tx, form.data.schedule);
				const scheduleId = scheduleInsertedRows.at(0)?.scheduleId;

				if (scheduleId === undefined) {
					throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, {
						form: 'new-schedule'
					});
				}

				// 5. Insert schedule entries
				const scheduleEntryData = sortedEntries.map((entry) => ({
					scheduleId,
					type: entry.type,
					date: entry.date,
					time: entry.time,
					note: entry.note
				}));

				const scheduleEntryInsertedRows = await services.scheduleEntry.insert(
					tx,
					scheduleEntryData
				);

				// 6. Map uniqueKey -> inserted row for robust pairing
				const entryKeyToInsertedRow = new Map(
					sortedEntries.map((entry, i) => [uniqueKey(entry), scheduleEntryInsertedRows[i]])
				);

				// 7. Insert scheduleEntryPlatform (join table)
				const scheduleEntryPlatformData: (typeof schema.scheduleEntryPlatform.$inferInsert)[] = [];
				for (const entry of sortedEntries) {
					const inserted = entryKeyToInsertedRow.get(uniqueKey(entry));
					if (!inserted) {
						throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, {
							form: 'new-schedule'
						});
					}
					for (const platformId of entry.platformIds) {
						scheduleEntryPlatformData.push({
							scheduleEntryId: inserted.scheduleEntryId,
							platformId
						});
					}
				}
				if (scheduleEntryPlatformData.length > 0) {
					await services.scheduleEntryPlatform.insert(tx, scheduleEntryPlatformData);
				}

				// 8. Handle specific details
				const scheduleAnimeDetailData: Array<typeof schema.scheduleAnimeDetail.$inferInsert> = [];
				const scheduleMiscDetailData: Array<typeof schema.scheduleMiscDetail.$inferInsert> = [];
				for (const entry of sortedEntries) {
					const scheduleEntry = entryKeyToInsertedRow.get(uniqueKey(entry));
					if (!scheduleEntry) {
						throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, {
							form: 'new-schedule'
						});
					}

					switch (entry.type) {
						case 'anime':
							const watchedAfter = computeWatchedAfterDate(
								entry.date,
								entry.time,
								entry.data.watchedAfter
							);
							if (!watchedAfter)
								throw new FormError(ERROR_CODES.forms.VALIDATION_FAILED, { form: 'new-schedule' });
							scheduleAnimeDetailData.push({
								scheduleEntryId: scheduleEntry.scheduleEntryId,
								watchedAfter
							});
							break;
						case 'misc':
							scheduleMiscDetailData.push({
								scheduleEntryId: scheduleEntry.scheduleEntryId,
								...entry.data
							});
							break;
					}
				}

				const scheduleAnimeDetailInsertedRows =
					scheduleAnimeDetailData.length > 0
						? await services.scheduleAnimeDetail.insert(tx, scheduleAnimeDetailData)
						: [];

				const scheduleMiscDetailInsertedRows =
					scheduleMiscDetailData.length > 0
						? await services.scheduleMiscDetail.insert(tx, scheduleMiscDetailData)
						: [];

				// 9. Map scheduleEntryId -> animeDetail for episode association
				const entryIdToAnimeDetail = new Map(
					scheduleAnimeDetailInsertedRows.map((row) => [row.scheduleEntryId, row])
				);

				// 10. Insert anime episodes
				const scheduleAnimeEpisodeData: Array<typeof schema.scheduleAnimeEpisode.$inferInsert> = [];
				for (const entry of sortedEntries) {
					switch (entry.type) {
						case 'anime':
							const scheduleEntry = entryKeyToInsertedRow.get(uniqueKey(entry));
							if (!scheduleEntry) {
								throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, {
									form: 'new-schedule'
								});
							}
							const animeDetail = entryIdToAnimeDetail.get(scheduleEntry.scheduleEntryId);
							if (!animeDetail) {
								throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, {
									form: 'new-schedule'
								});
							}
							for (const ep of entry.data.animeEpisodeIds) {
								scheduleAnimeEpisodeData.push({
									scheduleAnimeDetailId: animeDetail.scheduleAnimeDetailId,
									animeEpisodeId: ep
								});
							}
							break;
					}
				}
				if (scheduleAnimeEpisodeData.length > 0) {
					await services.scheduleAnimeEpisode.insert(tx, scheduleAnimeEpisodeData);
				}

				return { form };
			});
		} catch (err) {
			if (!(err instanceof FormError)) {
				let context: SentryLoggerOptions = {
					tags: {
						url: url.pathname,
						form: 'new-schedule'
					}
				};
				sentry.logServer(err, context);
			}

			if (err instanceof AppError) {
				return fail(err.httpStatus, { form, text: err.message });
			} else if (err instanceof Error) {
				return fail(500, { form, text: err.message });
			} else {
				return fail(500, { form, text: 'Unexpected error occurred' });
			}
		}
	}
};
