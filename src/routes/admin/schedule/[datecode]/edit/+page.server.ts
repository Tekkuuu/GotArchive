import type { PageServerLoad, Actions } from './$types';
import { schema, db, eq, sql, asc, and } from '$lib/server/db';
import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { parseISO, getISOWeek, getISOWeekYear } from 'date-fns';
import { AppError, ERROR_CODES } from '$lib/errors';
import { logger } from '$lib/server/logger';
import {
	EditScheduleSchema,
	AddScheduleEntrySchema,
	EditScheduleEntrySchema,
	ToggleCancelledSchema
} from '$lib/schemas';
import { insertScheduleEntry, updateScheduleEntry } from '$lib/server/schedule/entryActions';

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

	const [scheduleForm, addEntryForm, editEntryForm, toggleCancelledForm] = await Promise.all([
		superValidate(scheduleData, zod4(EditScheduleSchema)),
		superValidate(zod4(AddScheduleEntrySchema)),
		superValidate(zod4(EditScheduleEntrySchema)),
		superValidate(zod4(ToggleCancelledSchema))
	]);

	return {
		schedule: scheduleData,
		entries,
		animeSeasons,
		platforms,
		scheduleForm,
		addEntryForm,
		editEntryForm,
		toggleCancelledForm
	};
};

export const actions: Actions = {
	updateSchedule: async ({ request }) => {
		const form = await superValidate(request, zod4(EditScheduleSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const [scheduleData] = await db
			.select()
			.from(schema.schedule)
			.where(eq(schema.schedule.scheduleId, form.data.scheduleId))
			.limit(1);

		if (!scheduleData) {
			return fail(404, { form, error: 'Schedule not found' });
		}

		try {
			await db
				.update(schema.schedule)
				.set({
					note: form.data.note,
					preview: form.data.preview
				})
				.where(eq(schema.schedule.scheduleId, scheduleData.scheduleId));

			return { form };
		} catch (err) {
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
				cause: err,
				context: {
					action: 'updateMetadata',
					context: {
						formData: form.data,
						formErr: form.errors
					}
				}
			});
		}
	},
	updateEntry: async ({ request }) => {
		const form = await superValidate(request, zod4(EditScheduleEntrySchema));

		if (!form.valid) {
			return fail(400, { form, error: 'Invalid entry data' });
		}

		// Validate entry exists
		const [entry] = await db
			.select()
			.from(schema.scheduleEntry)
			.where(eq(schema.scheduleEntry.scheduleEntryId, form.data.scheduleEntryId))
			.limit(1);

		if (!entry) {
			return fail(404, { form, error: 'Entry not found' });
		}

		try {
			await updateScheduleEntry(form.data);
			return { form };
		} catch (err) {
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
				cause: err,
				context: { action: 'updateEntry', scheduleEntryId: form.data.scheduleEntryId }
			});
		}
	},
	toggleCancelled: async ({ request }) => {
		const form = await superValidate(request, zod4(ToggleCancelledSchema));

		if (!form.valid) {
			return fail(400, { form, error: 'Invalid data' });
		}

		try {
			await db
				.update(schema.scheduleEntry)
				.set({ isCancelled: form.data.isCancelled })
				.where(eq(schema.scheduleEntry.scheduleEntryId, form.data.scheduleEntryId));

			return { form };
		} catch (err) {
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
				cause: err,
				context: { action: 'toggleCancelled', scheduleEntryId: form.data.scheduleEntryId }
			});
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

			logger.warn('deleteEntry: schedule entry permanently deleted', { scheduleEntryId });
			return { success: true };
		} catch (err) {
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
				cause: err,
				context: { action: 'deleteEntry', scheduleEntryId }
			});
		}
	},
	addEntry: async ({ request, params }) => {
		const form = await superValidate(request, zod4(AddScheduleEntrySchema));

		if (!form.valid) {
			return fail(400, { form, error: 'Invalid entry data' });
		}

		const { datecode } = params;
		const year = parseInt(datecode.slice(0, 4));
		const week = parseInt(datecode.slice(4));

		// Validate date is in the same week
		const entryDate = parseISO(form.data.date);
		const entryYear = getISOWeekYear(entryDate);
		const entryWeek = getISOWeek(entryDate);

		if (entryYear !== year || entryWeek !== week) {
			return fail(400, {
				form,
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
			return fail(404, { form, error: 'Schedule not found' });
		}

		try {
			await insertScheduleEntry(form.data, scheduleData.scheduleId);
			return { form };
		} catch (err) {
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
				cause: err,
				context: { action: 'addEntry', datecode }
			});
		}
	}
};
