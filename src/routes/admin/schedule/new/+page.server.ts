import type { PageServerLoad, Actions } from './$types';
import { schema, db, asc, sql, inArray } from '$lib/server/db';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { ScheduleSchema } from './util';
import { getWeek, getYear } from 'date-fns';
import { fail, redirect } from '@sveltejs/kit';
import { AppError, ERROR_CODES } from '$lib/errors';
import { generateEntries } from '$lib/server/generateScheduleEntries';

export const load: PageServerLoad = async () => {
	const now = new Date();
	const currentWeek = getWeek(now, { weekStartsOn: 1 });
	const currentYear = getYear(now);
	const targetWeek = currentWeek + 1;
	const targetYear = currentWeek === 52 || currentWeek === 53 ? currentYear + 1 : currentYear;

	const [{ entries, slotsToReset }, animeSeasons, platforms] = await Promise.all([
		generateEntries(targetYear, targetWeek),
		db
			.select()
			.from(schema.animeSeason)
			.orderBy(asc(schema.animeSeason.animeId), asc(schema.animeSeason.sequence)),
		db.select().from(schema.platform).orderBy(asc(schema.platform.name))
	]);

	const form = await superValidate(
		{
			schedule: {
				year: targetYear,
				week: targetWeek,
				note: '',
				preview: true
			},
			entries,
			slotsToReset
		},
		zod4(ScheduleSchema)
	);

	return { form, animeSeasons, platforms };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(ScheduleSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		// Validate that we have at least one entry
		if (!form.data.entries || form.data.entries.length === 0) {
			return fail(400, {
				form,
				error: 'Schedule must have at least one entry.'
			});
		}

		try {
			// Check if schedule already exists for this year/week
			const existingSchedule = await db
				.select()
				.from(schema.schedule)
				.where(
					sql`${schema.schedule.year} = ${form.data.schedule.year} AND ${schema.schedule.week} = ${form.data.schedule.week}`
				)
				.limit(1);

			if (existingSchedule.length > 0) {
				return fail(409, {
					form,
					error: `Schedule for year ${form.data.schedule.year}, week ${form.data.schedule.week} already exists.`
				});
			}

			// Use a transaction to ensure atomicity
			await db.transaction(async (tx) => {
				// Insert schedule
				const [scheduleRecord] = await tx
					.insert(schema.schedule)
					.values({
						year: form.data.schedule.year,
						week: form.data.schedule.week,
						note: form.data.schedule.note || null,
						preview: form.data.schedule.preview
					})
					.returning();

				// Insert entries
				for (const entry of form.data.entries) {
					const [entryRecord] = await tx
						.insert(schema.scheduleEntry)
						.values({
							scheduleId: scheduleRecord.scheduleId,
							type: entry.type,
							date: entry.date,
							time: entry.time || null,
							note: entry.note || null,
							logoUrl: entry.logoUrl || null,
							title: entry.title || null,
							description: entry.description || null,
							cancelledText: entry.cancelledText || null,
							isCancelled: entry.isCancelled
						})
						.returning();

					// Insert anime season associations if present
					if (entry.anime && entry.anime.length > 0) {
						for (const anime of entry.anime) {
							await tx.insert(schema.scheduleEntryAnimeSeason).values({
								scheduleEntryId: entryRecord.scheduleEntryId,
								animeSeasonId: anime.animeSeasonId,
								episodes: anime.episodes
							});
						}
					}

					// Insert platform associations if present
					if (entry.platforms && entry.platforms.length > 0) {
						for (const platformId of entry.platforms) {
							await tx.insert(schema.scheduleEntryPlatform).values({
								scheduleEntryId: entryRecord.scheduleEntryId,
								platformId
							});
						}
					}
				}
			});

			// Clear startingSequence/startingEpisode on all slots that were used as
			// force-restart / bootstrap overrides during generation
			if (form.data.slotsToReset.length > 0) {
				await db
					.update(schema.scheduleSlot)
					.set({ startingSequence: null, startingEpisode: null })
					.where(inArray(schema.scheduleSlot.scheduleSlotId, form.data.slotsToReset));
			}

			// Redirect to schedule list or detail page
			return redirect(303, `/admin/schedule`);
		} catch (error) {
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
				cause: error,
				context: { action: 'createSchedule' }
			});
		}
	}
};
