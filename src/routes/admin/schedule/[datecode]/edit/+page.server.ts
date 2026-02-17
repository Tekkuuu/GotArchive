import type { PageServerLoad, Actions } from './$types';
import { schema, db, eq, sql, asc, and } from '$lib/server/db';
import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { parseISO, setISOWeek, setISOWeekYear, format, getISOWeek, getISOWeekYear } from 'date-fns';
import { AppError, ERROR_CODES } from '$lib/errors';

// Schema for editing schedule metadata
const EditScheduleMetadataSchema = z.object({
	year: z.number().int().min(1900).max(2100),
	week: z.number().int().min(1).max(53),
	note: z.string().max(1000).optional()
});

export const load: PageServerLoad = async ({ params }) => {
	const { datecode } = params;

	// Parse datecode (format: YYYYWW)
	if (datecode.length !== 6) {
		throw error(400, 'Invalid datecode format');
	}

	const year = parseInt(datecode.slice(0, 4));
	const week = parseInt(datecode.slice(4));

	if (isNaN(year) || isNaN(week) || week < 1 || week > 53) {
		throw error(400, 'Invalid year or week');
	}

	// Fetch schedule
	const [scheduleData] = await db
		.select()
		.from(schema.schedule)
		.where(and(eq(schema.schedule.year, year), eq(schema.schedule.week, week)))
		.limit(1);

	if (!scheduleData) {
		throw error(404, 'Schedule not found');
	}

	// Fetch entries with their anime seasons and platforms using CTEs to avoid Cartesian product
	const entryAnime = db.$with('entry_anime').as(
		db
			.select({
				scheduleEntryId: schema.scheduleEntry.scheduleEntryId,
				animeSeasons: sql<Array<{ animeSeasonId: string; episodes: string }> | null>`json_agg(
          json_build_object(
            'animeSeasonId', ${schema.scheduleEntryAnimeSeason.animeSeasonId},
            'episodes', ${schema.scheduleEntryAnimeSeason.episodes}
          )
          ORDER BY ${schema.scheduleEntryAnimeSeason.animeSeasonId}
        ) FILTER (WHERE ${schema.scheduleEntryAnimeSeason.animeSeasonId} IS NOT NULL)`.as(
					'animeSeasons'
				)
			})
			.from(schema.scheduleEntry)
			.leftJoin(
				schema.scheduleEntryAnimeSeason,
				eq(schema.scheduleEntry.scheduleEntryId, schema.scheduleEntryAnimeSeason.scheduleEntryId)
			)
			.where(eq(schema.scheduleEntry.scheduleId, scheduleData.scheduleId))
			.groupBy(schema.scheduleEntry.scheduleEntryId)
	);

	const entryPlatforms = db.$with('entry_platforms').as(
		db
			.select({
				scheduleEntryId: schema.scheduleEntry.scheduleEntryId,
				platforms: sql<Array<string> | null>`array_agg(
          ${schema.scheduleEntryPlatform.platformId}
          ORDER BY ${schema.scheduleEntryPlatform.platformId}
        ) FILTER (WHERE ${schema.scheduleEntryPlatform.platformId} IS NOT NULL)`.as('platforms')
			})
			.from(schema.scheduleEntry)
			.leftJoin(
				schema.scheduleEntryPlatform,
				eq(schema.scheduleEntry.scheduleEntryId, schema.scheduleEntryPlatform.scheduleEntryId)
			)
			.where(eq(schema.scheduleEntry.scheduleId, scheduleData.scheduleId))
			.groupBy(schema.scheduleEntry.scheduleEntryId)
	);

	const entries = await db
		.with(entryAnime, entryPlatforms)
		.select({
			entry: schema.scheduleEntry,
			animeSeasons: entryAnime.animeSeasons,
			platforms: entryPlatforms.platforms
		})
		.from(schema.scheduleEntry)
		.leftJoin(entryAnime, eq(schema.scheduleEntry.scheduleEntryId, entryAnime.scheduleEntryId))
		.leftJoin(
			entryPlatforms,
			eq(schema.scheduleEntry.scheduleEntryId, entryPlatforms.scheduleEntryId)
		)
		.where(eq(schema.scheduleEntry.scheduleId, scheduleData.scheduleId));

	// Fetch all anime seasons for reference
	const animeSeasons = await db.select().from(schema.animeSeason);

	// Fetch all platforms
	const platforms = await db.select().from(schema.platform).orderBy(asc(schema.platform.name));

	// Create form for metadata editing
	const metadataForm = await superValidate(
		{
			year: scheduleData.year,
			week: scheduleData.week,
			note: scheduleData.note || ''
		},
		zod4(EditScheduleMetadataSchema)
	);

	return {
		schedule: scheduleData,
		entries,
		animeSeasons,
		platforms,
		metadataForm
	};
};

export const actions: Actions = {
	updateMetadata: async ({ request, params }) => {
		const { datecode } = params;
		const year = parseInt(datecode.slice(0, 4));
		const week = parseInt(datecode.slice(4));

		const form = await superValidate(request, zod4(EditScheduleMetadataSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			// Get the schedule
			const [scheduleData] = await db
				.select()
				.from(schema.schedule)
				.where(sql`${schema.schedule.year} = ${year} AND ${schema.schedule.week} = ${week}`)
				.limit(1);

			if (!scheduleData) {
				return fail(404, { form, error: 'Schedule not found' });
			}

			// Check if year/week changed
			const yearChanged = form.data.year !== year;
			const weekChanged = form.data.week !== week;

			if (yearChanged || weekChanged) {
				// Check if target year/week already exists
				const [existingSchedule] = await db
					.select()
					.from(schema.schedule)
					.where(
						sql`${schema.schedule.year} = ${form.data.year} AND ${schema.schedule.week} = ${form.data.week}`
					)
					.limit(1);

				if (existingSchedule) {
					return fail(409, {
						form,
						error: `Schedule for year ${form.data.year}, week ${form.data.week} already exists.`
					});
				}

				// Update schedule metadata
				await db
					.update(schema.schedule)
					.set({
						year: form.data.year,
						week: form.data.week,
						note: form.data.note || null
					})
					.where(eq(schema.schedule.scheduleId, scheduleData.scheduleId));

				// Recalculate all entry dates
				const entries = await db
					.select()
					.from(schema.scheduleEntry)
					.where(eq(schema.scheduleEntry.scheduleId, scheduleData.scheduleId));

				for (const entry of entries) {
					let date = parseISO(entry.date);
					date = setISOWeekYear(date, form.data.year);
					date = setISOWeek(date, form.data.week);
					const newDateStr = format(date, 'yyyy-MM-dd');

					await db
						.update(schema.scheduleEntry)
						.set({ date: newDateStr })
						.where(eq(schema.scheduleEntry.scheduleEntryId, entry.scheduleEntryId));
				}

				// Redirect to new datecode
				const newDatecode = `${form.data.year}${form.data.week.toString().padStart(2, '0')}`;
				return redirect(303, `/admin/schedule/${newDatecode}/edit`);
			} else {
				// Only update note
				await db
					.update(schema.schedule)
					.set({ note: form.data.note || null })
					.where(eq(schema.schedule.scheduleId, scheduleData.scheduleId));
			}

			return { form };
		} catch (err) {
			console.error('Failed to update schedule metadata:', err);
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, { cause: err });
		}
	},

	updateEntry: async ({ request }) => {
		const formData = await request.formData();

		const scheduleEntryId = formData.get('scheduleEntryId') as string;
		const time = (formData.get('time') as string) || null;
		const title = (formData.get('title') as string) || null;
		const description = (formData.get('description') as string) || null;
		const logoUrl = (formData.get('logoUrl') as string) || null;
		const note = (formData.get('note') as string) || null;
		const cancelledText = (formData.get('cancelledText') as string) || null;
		const isCancelled = formData.get('isCancelled') === 'true';

		// Parse anime data (JSON string)
		const animeJson = formData.get('anime') as string;
		const anime = animeJson ? JSON.parse(animeJson) : null;

		// Parse platforms data (JSON string)
		const platformsJson = formData.get('platforms') as string;
		const platforms = platformsJson ? JSON.parse(platformsJson) : null;

		try {
			// Validate entry exists
			const [entry] = await db
				.select()
				.from(schema.scheduleEntry)
				.where(eq(schema.scheduleEntry.scheduleEntryId, scheduleEntryId))
				.limit(1);

			if (!entry) {
				return fail(404, { error: 'Entry not found' });
			}

			// Update entry
			await db
				.update(schema.scheduleEntry)
				.set({
					time,
					title,
					description,
					logoUrl: logoUrl || null,
					note,
					cancelledText,
					isCancelled
				})
				.where(eq(schema.scheduleEntry.scheduleEntryId, scheduleEntryId));

			// Update anime season associations
			if (anime !== null) {
				// Delete existing associations
				await db
					.delete(schema.scheduleEntryAnimeSeason)
					.where(eq(schema.scheduleEntryAnimeSeason.scheduleEntryId, scheduleEntryId));

				// Insert new associations
				if (anime.length > 0) {
					for (const animeEntry of anime) {
						await db.insert(schema.scheduleEntryAnimeSeason).values({
							scheduleEntryId,
							animeSeasonId: animeEntry.animeSeasonId,
							episodes: animeEntry.episodes
						});
					}
				}
			}

			// Update platform associations
			if (platforms !== null) {
				// Delete existing associations
				await db
					.delete(schema.scheduleEntryPlatform)
					.where(eq(schema.scheduleEntryPlatform.scheduleEntryId, scheduleEntryId));

				// Insert new associations
				if (platforms.length > 0) {
					for (const platformId of platforms) {
						await db.insert(schema.scheduleEntryPlatform).values({
							scheduleEntryId,
							platformId
						});
					}
				}
			}

			return { success: true };
		} catch (err) {
			console.error('Failed to update entry:', err);
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, { cause: err });
		}
	},

	deleteEntry: async ({ request }) => {
		const formData = await request.formData();
		const scheduleEntryId = formData.get('scheduleEntryId') as string;

		if (!scheduleEntryId) {
			return fail(400, { error: 'Entry ID is required' });
		}

		try {
			await db.transaction(async (tx) => {
				// Delete anime season associations
				await tx
					.delete(schema.scheduleEntryAnimeSeason)
					.where(eq(schema.scheduleEntryAnimeSeason.scheduleEntryId, scheduleEntryId));

				// Delete platform associations
				await tx
					.delete(schema.scheduleEntryPlatform)
					.where(eq(schema.scheduleEntryPlatform.scheduleEntryId, scheduleEntryId));

				// Delete entry
				await tx
					.delete(schema.scheduleEntry)
					.where(eq(schema.scheduleEntry.scheduleEntryId, scheduleEntryId));
			});

			return { success: true };
		} catch (err) {
			console.error('Failed to delete entry:', err);
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, { cause: err });
		}
	},
	addEntry: async ({ request, params }) => {
		const formData = await request.formData();
		const { datecode } = params;
		const year = parseInt(datecode.slice(0, 4));
		const week = parseInt(datecode.slice(4));

		// Get form data
		const date = formData.get('date') as string;
		const type = ((formData.get('type') as string) || 'misc') as
			| 'anime'
			| 'hololive'
			| 'game'
			| 'event'
			| 'sponsored'
			| 'misc';
		const time = (formData.get('time') as string) || null;
		const title = (formData.get('title') as string) || null;
		const description = (formData.get('description') as string) || null;
		const logoUrl = (formData.get('logoUrl') as string) || null;
		const note = (formData.get('note') as string) || null;
		const cancelledText = (formData.get('cancelledText') as string) || null;
		const isCancelled = formData.get('isCancelled') === 'true';

		// Parse anime and platforms
		const animeJson = formData.get('anime') as string;
		const platformsJson = formData.get('platforms') as string;
		const anime = animeJson ? JSON.parse(animeJson) : null;
		const platforms = platformsJson ? JSON.parse(platformsJson) : null;

		try {
			// Validate date is in the same week
			const entryDate = parseISO(date);
			const entryYear = getISOWeekYear(entryDate);
			const entryWeek = getISOWeek(entryDate);

			if (entryYear !== year || entryWeek !== week) {
				return fail(400, {
					error: `Entry date must be in year ${year}, week ${week}. Selected date is in year ${entryYear}, week ${entryWeek}.`
				});
			}

			// Get schedule
			const [scheduleData] = await db
				.select()
				.from(schema.schedule)
				.where(sql`${schema.schedule.year} = ${year} AND ${schema.schedule.week} = ${week}`)
				.limit(1);

			if (!scheduleData) {
				return fail(404, { error: 'Schedule not found' });
			}

			// Insert entry
			const [newEntry] = await db
				.insert(schema.scheduleEntry)
				.values({
					scheduleId: scheduleData.scheduleId,
					type,
					date,
					time,
					note,
					logoUrl: logoUrl || null,
					title,
					description,
					cancelledText,
					isCancelled
				})
				.returning();

			// Insert anime season associations
			if (anime && anime.length > 0) {
				for (const animeEntry of anime) {
					await db.insert(schema.scheduleEntryAnimeSeason).values({
						scheduleEntryId: newEntry.scheduleEntryId,
						animeSeasonId: animeEntry.animeSeasonId,
						episodes: animeEntry.episodes
					});
				}
			}

			// Insert platform associations
			if (platforms && platforms.length > 0) {
				for (const platformId of platforms) {
					await db.insert(schema.scheduleEntryPlatform).values({
						scheduleEntryId: newEntry.scheduleEntryId,
						platformId
					});
				}
			}

			return { success: true };
		} catch (err) {
			console.error('Failed to add entry:', err);
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, { cause: err });
		}
	}
};
