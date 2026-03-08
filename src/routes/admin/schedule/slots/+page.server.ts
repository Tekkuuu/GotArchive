import { db, schema, eq, asc, sql } from '$lib/server/db';
import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { AddScheduleSlotSchema, EditScheduleSlotSchema } from '$lib/components/schedule/slot/util';
import { actions as slotActions } from '$lib/components/schedule/slot';
import { z } from 'zod/v4';
import { logger } from '$lib/server/logger';

export const load: PageServerLoad = async () => {
	// Load all schedule slots with their platforms and anime info
	const slots = await db
		.select({
			slot: schema.scheduleSlot,
			anime: schema.anime,
			platforms: sql<
				Array<string>
			>`array_agg(${schema.platform.name} ORDER BY ${schema.platform.name} ASC)`
		})
		.from(schema.scheduleSlot)
		.leftJoin(schema.anime, eq(schema.scheduleSlot.animeId, schema.anime.animeId))
		.leftJoin(
			schema.scheduleSlotPlatform,
			eq(schema.scheduleSlot.scheduleSlotId, schema.scheduleSlotPlatform.scheduleSlotId)
		)
		.leftJoin(
			schema.platform,
			eq(schema.scheduleSlotPlatform.platformId, schema.platform.platformId)
		)
		.groupBy(schema.scheduleSlot.scheduleSlotId, schema.anime.animeId)
		.orderBy(asc(schema.scheduleSlot.dayOfWeek), asc(schema.scheduleSlot.time));

	// Load all anime and all seasons for modals
	const anime = await db.select().from(schema.anime).orderBy(asc(schema.anime.titleNative));
	const animeSeasons = await db
		.select()
		.from(schema.animeSeason)
		.orderBy(asc(schema.animeSeason.animeId), asc(schema.animeSeason.sequence));
	const platforms = await db.select().from(schema.platform).orderBy(asc(schema.platform.name));

	const addForm = await superValidate(zod4(AddScheduleSlotSchema));
	const editForm = await superValidate(zod4(EditScheduleSlotSchema));

	return {
		addForm,
		editForm,
		slots,
		animeSeasons,
		anime,
		platforms
	};
};

export const actions: Actions = {
	addSlot: async ({ request }) => {
		const form = await superValidate(request, zod4(AddScheduleSlotSchema));

		if (!form.valid) {
			return fail(422, { form });
		}

		const result = await slotActions.createScheduleSlot(form.data);
		if (result && !result.success) {
			return fail(500, { form });
		}
		return { form };
	},
	editSlot: async ({ request }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, zod4(EditScheduleSlotSchema));
		const slotId = z.uuid().safeParse(formData.get('slotId'));

		if (!form.valid || !slotId.success) {
			logger.error('Invalid form data for editSlot', { form, slotId });
			return fail(422, { form });
		}

		logger.info('Editing slot', { slotId: slotId.data, data: form.data });

		const result = await slotActions.editScheduleSlot(slotId.data, form.data);
		if (!result.success) {
			return fail(500, { form });
		}
		return { form };
	},
	toggleSlot: async ({ request }) => {
		const formData = await request.formData();
		const slotId = z.uuid().safeParse(formData.get('slotId'));
		const isActive = z.boolean().safeParse(formData.get('slotActive') === 'true');

		logger.info('Toggling slot', {
			slotId: formData.get('slotId'),
			isActive: formData.get('slotActive')
		});

		if (slotId.success && slotId.data && isActive.success) {
			try {
				await db.transaction(async (tx) => {
					await tx
						.update(schema.scheduleSlot)
						.set({ isActive: isActive.data })
						.where(eq(schema.scheduleSlot.scheduleSlotId, slotId.data));
				});
				return { success: true };
			} catch (e) {
				logger.error('Error', { error: e });
				return { success: false, error: 'Failed to update slot status' };
			}
		}
		return { success: false, error: 'Invalid form data' };
	},
	deleteSlot: async ({ request }) => {
		const formData = await request.formData();
		const slotId = z.uuid().safeParse(formData.get('slotId'));

		logger.info('Deleting slot', {
			slotId: formData.get('slotId')
		});

		if (slotId.success && slotId.data) {
			try {
				await db.transaction(async (tx) => {
					await tx
						.delete(schema.scheduleSlot)
						.where(eq(schema.scheduleSlot.scheduleSlotId, slotId.data));
				});
			} catch (e) {
				logger.error('Error deleting slot', { error: e });
				return { success: false, error: 'Failed to delete slot' };
			}
		}
	}
};
