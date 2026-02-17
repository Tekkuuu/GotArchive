import type { PageServerLoad, Actions } from './$types';
import { schema, db, eq, desc, sql } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import { AppError, ERROR_CODES } from '$lib/errors';

export const load: PageServerLoad = async () => {
	// Load all schedules with entry count, ordered by most recent first
	const schedules = await db
		.select({
			scheduleId: schema.schedule.scheduleId,
			year: schema.schedule.year,
			week: schema.schedule.week,
			note: schema.schedule.note,
			preview: schema.schedule.preview,
			entryCount: sql<number>`COUNT(${schema.scheduleEntry.scheduleEntryId})::int`
		})
		.from(schema.schedule)
		.leftJoin(schema.scheduleEntry, eq(schema.schedule.scheduleId, schema.scheduleEntry.scheduleId))
		.groupBy(
			schema.schedule.scheduleId,
			schema.schedule.year,
			schema.schedule.week,
			schema.schedule.note,
			schema.schedule.preview
		)
		.orderBy(desc(schema.schedule.year), desc(schema.schedule.week));

	return { schedules };
};

export const actions: Actions = {
	togglePreview: async ({ request }) => {
		const formData = await request.formData();
		const scheduleId = formData.get('scheduleId') as string;
		const preview = formData.get('preview') === 'true';

		if (!scheduleId) {
			return fail(400, { error: 'Schedule ID is required' });
		}

		try {
			await db
				.update(schema.schedule)
				.set({ preview })
				.where(eq(schema.schedule.scheduleId, scheduleId));

			return { success: true };
		} catch (error) {
			console.error('Failed to toggle preview:', error);
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, { cause: error });
		}
	},
	deleteSchedule: async ({ request }) => {
		const formData = await request.formData();
		const scheduleId = formData.get('scheduleId') as string;

		if (!scheduleId) {
			return fail(400, { error: 'Schedule ID is required' });
		}

		try {
			await db.transaction(async (tx) => {
				const entries = await tx
					.select({ scheduleEntryId: schema.scheduleEntry.scheduleEntryId })
					.from(schema.scheduleEntry)
					.where(eq(schema.scheduleEntry.scheduleId, scheduleId));

				const entryIds = entries.map((e) => e.scheduleEntryId);

				if (entryIds.length > 0) {
					await tx
						.delete(schema.scheduleEntryAnimeSeason)
						.where(sql`${schema.scheduleEntryAnimeSeason.scheduleEntryId} = ANY(${entryIds})`);

					await tx
						.delete(schema.scheduleEntryPlatform)
						.where(sql`${schema.scheduleEntryPlatform.scheduleEntryId} = ANY(${entryIds})`);

					await tx
						.delete(schema.scheduleEntry)
						.where(eq(schema.scheduleEntry.scheduleId, scheduleId));
				}

				await tx.delete(schema.schedule).where(eq(schema.schedule.scheduleId, scheduleId));
			});

			return { success: true };
		} catch (error) {
			console.error('Failed to delete schedule:', error);
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, { cause: error });
		}
	}
};
