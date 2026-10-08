import { command, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { getISOWeek, getISOWeekYear, parseISO } from 'date-fns';
import { and, desc, eq, inArray, lt, or } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { requireStaff } from '$lib/server/auth';
import { AppError, ERROR_CODES } from '$lib/errors';
import { logger } from '$lib/server/logger';
import { generateEntries } from '$lib/server/schedule/generateEntries';
import {
	insertScheduleEntry,
	updateScheduleEntry as updateEntryInDb
} from '$lib/server/schedule/entryActions';
import {
	AddScheduleEntrySchema,
	DeleteScheduleSchema,
	EditScheduleEntrySchema,
	EditScheduleSchema,
	ScheduleSchema,
	ToggleCancelledSchema,
	TogglePreviewSchema,
	ValidateDateSchema
} from '$lib/schemas';

/** Schedule admin operations. */

const AddEntryToScheduleSchema = AddScheduleEntrySchema.extend({ scheduleId: z.uuid() });
const DeleteScheduleEntrySchema = z.object({ scheduleEntryId: z.uuid() });

export const scheduleExists = query(ValidateDateSchema, async ({ year, week }) => {
	await requireStaff();

	const existing = await db
		.select()
		.from(schema.schedule)
		.where(and(eq(schema.schedule.year, year), eq(schema.schedule.week, week)))
		.limit(1);

	return existing.length > 0;
});

export const generateScheduleEntries = query(ValidateDateSchema, async ({ year, week }) => {
	await requireStaff();

	return generateEntries(year, week);
});

export const createSchedule = command(ScheduleSchema, async (data) => {
	await requireStaff();

	if (data.entries.length === 0) {
		error(400, 'Schedule must have at least one entry.');
	}

	const existingSchedule = await db
		.select()
		.from(schema.schedule)
		.where(
			and(
				eq(schema.schedule.year, data.schedule.year),
				eq(schema.schedule.week, data.schedule.week)
			)
		)
		.limit(1);

	if (existingSchedule.length > 0) {
		error(
			409,
			`Schedule for year ${data.schedule.year}, week ${data.schedule.week} already exists.`
		);
	}

	try {
		await db.transaction(async (tx) => {
			const [scheduleRecord] = await tx
				.insert(schema.schedule)
				.values({
					year: data.schedule.year,
					week: data.schedule.week,
					note: data.schedule.note || null,
					preview: data.schedule.preview
				})
				.returning();

			for (const entry of data.entries) {
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

				if (entry.anime && entry.anime.length > 0) {
					for (const anime of entry.anime) {
						await tx.insert(schema.scheduleEntryAnimeSeason).values({
							scheduleEntryId: entryRecord.scheduleEntryId,
							animeSeasonId: anime.animeSeasonId,
							episodes: anime.episodes
						});
					}
				}

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
	} catch (err) {
		throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
			cause: err,
			context: { action: 'createSchedule' }
		});
	}

	return { success: true as const };
});

export const updateScheduleMetadata = command(EditScheduleSchema, async (data) => {
	await requireStaff();

	const [schedule] = await db
		.select()
		.from(schema.schedule)
		.where(eq(schema.schedule.scheduleId, data.scheduleId))
		.limit(1);

	if (!schedule) {
		error(404, 'Schedule not found');
	}

	try {
		await db
			.update(schema.schedule)
			.set({ note: data.note, preview: data.preview })
			.where(eq(schema.schedule.scheduleId, data.scheduleId));
	} catch (err) {
		throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
			cause: err,
			context: { action: 'updateScheduleMetadata' }
		});
	}

	return { success: true as const };
});

export const addScheduleEntry = command(AddEntryToScheduleSchema, async (data) => {
	await requireStaff();

	const { scheduleId, ...entry } = data;

	const [schedule] = await db
		.select()
		.from(schema.schedule)
		.where(eq(schema.schedule.scheduleId, scheduleId))
		.limit(1);

	if (!schedule) {
		error(404, 'Schedule not found');
	}

	const entryDate = parseISO(entry.date);
	if (getISOWeekYear(entryDate) !== schedule.year || getISOWeek(entryDate) !== schedule.week) {
		error(400, `Entry date must be in year ${schedule.year}, week ${schedule.week}.`);
	}

	try {
		await insertScheduleEntry(entry, scheduleId);
	} catch (err) {
		throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
			cause: err,
			context: { action: 'addScheduleEntry', scheduleId }
		});
	}

	return { success: true as const };
});

export const updateScheduleEntry = command(EditScheduleEntrySchema, async (data) => {
	await requireStaff();

	const [row] = await db
		.select({ entry: schema.scheduleEntry, schedule: schema.schedule })
		.from(schema.scheduleEntry)
		.innerJoin(schema.schedule, eq(schema.scheduleEntry.scheduleId, schema.schedule.scheduleId))
		.where(eq(schema.scheduleEntry.scheduleEntryId, data.scheduleEntryId))
		.limit(1);

	if (!row) {
		error(404, 'Entry not found');
	}

	const entryDate = parseISO(data.date);
	if (
		getISOWeekYear(entryDate) !== row.schedule.year ||
		getISOWeek(entryDate) !== row.schedule.week
	) {
		error(400, `Entry date must be in year ${row.schedule.year}, week ${row.schedule.week}.`);
	}

	try {
		await updateEntryInDb(data);
	} catch (err) {
		throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
			cause: err,
			context: { action: 'updateScheduleEntry', scheduleEntryId: data.scheduleEntryId }
		});
	}

	return { success: true as const };
});

export const toggleCancelled = command(ToggleCancelledSchema, async (data) => {
	await requireStaff();

	try {
		await db
			.update(schema.scheduleEntry)
			.set({ isCancelled: data.isCancelled })
			.where(eq(schema.scheduleEntry.scheduleEntryId, data.scheduleEntryId));
	} catch (err) {
		throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
			cause: err,
			context: { action: 'toggleCancelled', scheduleEntryId: data.scheduleEntryId }
		});
	}

	return { success: true as const };
});

export const deleteScheduleEntry = command(
	DeleteScheduleEntrySchema,
	async ({ scheduleEntryId }) => {
		await requireStaff();

		try {
			await db.transaction(async (tx) => {
				await tx
					.delete(schema.scheduleEntryAnimeSeason)
					.where(eq(schema.scheduleEntryAnimeSeason.scheduleEntryId, scheduleEntryId));

				await tx
					.delete(schema.scheduleEntryPlatform)
					.where(eq(schema.scheduleEntryPlatform.scheduleEntryId, scheduleEntryId));

				await tx
					.delete(schema.scheduleEntry)
					.where(eq(schema.scheduleEntry.scheduleEntryId, scheduleEntryId));
			});

			logger.warn('deleteEntry: schedule entry permanently deleted', { scheduleEntryId });
		} catch (err) {
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
				cause: err,
				context: { action: 'deleteScheduleEntry', scheduleEntryId }
			});
		}

		return { success: true as const };
	}
);

export const togglePreview = command(TogglePreviewSchema, async (data) => {
	await requireStaff();

	try {
		await db
			.update(schema.schedule)
			.set({ preview: data.preview })
			.where(eq(schema.schedule.scheduleId, data.scheduleId));
	} catch (err) {
		throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
			cause: err,
			context: { action: 'togglePreview' }
		});
	}

	return { success: true as const };
});

export const deleteSchedule = command(DeleteScheduleSchema, async (data) => {
	await requireStaff();

	try {
		let deletedEntryCount = 0;

		await db.transaction(async (tx) => {
			const entries = await tx
				.select({ scheduleEntryId: schema.scheduleEntry.scheduleEntryId })
				.from(schema.scheduleEntry)
				.where(eq(schema.scheduleEntry.scheduleId, data.scheduleId));

			const entryIds = entries.map((e) => e.scheduleEntryId);
			deletedEntryCount = entryIds.length;

			if (entryIds.length > 0) {
				await tx
					.delete(schema.scheduleEntryAnimeSeason)
					.where(inArray(schema.scheduleEntryAnimeSeason.scheduleEntryId, entryIds));

				await tx
					.delete(schema.scheduleEntryPlatform)
					.where(inArray(schema.scheduleEntryPlatform.scheduleEntryId, entryIds));

				await tx
					.delete(schema.scheduleEntry)
					.where(eq(schema.scheduleEntry.scheduleId, data.scheduleId));
			}

			await tx.delete(schema.schedule).where(eq(schema.schedule.scheduleId, data.scheduleId));
		});

		logger.warn('deleteSchedule: schedule and all entries permanently deleted', {
			scheduleId: data.scheduleId,
			deletedEntryCount
		});
	} catch (err) {
		throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
			cause: err,
			context: { action: 'deleteSchedule' }
		});
	}

	return { success: true as const };
});

export const getLatestNote = query(
	z.object({ week: z.number().min(1).max(53), year: z.number().min(1900).max(2100) }),
	async ({ year, week }) => {
		await requireStaff();

		const [latest] = await db
			.select({ note: schema.schedule.note })
			.from(schema.schedule)
			.where(
				or(
					lt(schema.schedule.year, year),
					and(eq(schema.schedule.year, year), lt(schema.schedule.week, week))
				)
			)
			.orderBy(desc(schema.schedule.year), desc(schema.schedule.week))
			.limit(1);

		return { note: latest?.note ?? '' };
	}
);
