import type { PageServerLoad, Actions } from './$types';
import { schema, db, eq, desc, sql, inArray } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import { AppError, ERROR_CODES } from '$lib/errors';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { DeleteScheduleSchema, TogglePreviewSchema } from '$lib/schemas';

export const load: PageServerLoad = async () => {
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

	const deleteForm = await superValidate(zod4(DeleteScheduleSchema));
	const togglePreviewForm = await superValidate(zod4(TogglePreviewSchema));

	return { schedules, deleteForm, togglePreviewForm };
};

export const actions: Actions = {
	togglePreview: async ({ request }) => {
		const form = await superValidate(request, zod4(TogglePreviewSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await db
				.update(schema.schedule)
				.set({ preview: form.data.preview })
				.where(eq(schema.schedule.scheduleId, form.data.scheduleId));

			return { form, success: true };
		} catch (error) {
			console.error('Failed to toggle preview:', error);
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, { cause: error });
		}
	},

	deleteSchedule: async ({ request }) => {
		const form = await superValidate(request, zod4(DeleteScheduleSchema));

		if (!form.valid) {
			return fail(400, { form, error: 'Invalid schedule ID' });
		}

		try {
			await db.transaction(async (tx) => {
				const entries = await tx
					.select({ scheduleEntryId: schema.scheduleEntry.scheduleEntryId })
					.from(schema.scheduleEntry)
					.where(eq(schema.scheduleEntry.scheduleId, form.data.scheduleId));

				const entryIds = entries.map((e) => e.scheduleEntryId);

				if (entryIds.length > 0) {
					await tx
						.delete(schema.scheduleEntryAnimeSeason)
						.where(inArray(schema.scheduleEntryAnimeSeason.scheduleEntryId, entryIds));

					await tx
						.delete(schema.scheduleEntryPlatform)
						.where(inArray(schema.scheduleEntryPlatform.scheduleEntryId, entryIds));

					await tx
						.delete(schema.scheduleEntry)
						.where(eq(schema.scheduleEntry.scheduleId, form.data.scheduleId));
				}

				await tx
					.delete(schema.schedule)
					.where(eq(schema.schedule.scheduleId, form.data.scheduleId));
			});

			return { form, success: true };
		} catch (error) {
			console.error('Failed to delete schedule:', error);
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, { cause: error });
		}
	}
};
