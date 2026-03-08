import { schema, db, eq } from '$lib/server/db';
import { AddScheduleSlotSchema, EditScheduleSlotSchema } from './util';
import { z } from 'zod/v4';
import { logger } from '$lib/server/logger';
import _ from 'lodash';

export async function createScheduleSlot(data: z.infer<typeof AddScheduleSlotSchema>) {
	try {
		await db.transaction(async (tx) => {
			logger.info({ msg: 'Creating schedule slot', data });
			const dups = [...new Set([data.dayOfWeek, ...data.duplicateToDays])].sort((a, b) => a - b);
			const pureSlot = _.omit(data, ['duplicateToDays', 'platforms']);
			const lowestDay = dups[0];
			const slots = dups.map((day) =>
				day === lowestDay
					? { ...pureSlot, dayOfWeek: day }
					: { ...pureSlot, dayOfWeek: day, startingSequence: null, startingEpisode: null }
			);

			// Insert slots and get their IDs
			const insertedSlots = await tx.insert(schema.scheduleSlot).values(slots).returning();

			// Insert platform associations for each slot
			if (data.platforms.length > 0) {
				const platformAssociations = insertedSlots.flatMap((slot) =>
					data.platforms.map((p) => ({
						scheduleSlotId: slot.scheduleSlotId,
						platformId: p.platformId
					}))
				);
				await tx.insert(schema.scheduleSlotPlatform).values(platformAssociations);
			}

			logger.info({ msg: 'Schedule slot created successfully' });
		});
	} catch (e) {
		logger.error({ msg: 'Error creating schedule slot', error: e, data });
		return { success: false, error: e };
	}
}

export async function editScheduleSlot(
	slotId: string,
	data: z.infer<typeof EditScheduleSlotSchema>
) {
	try {
		await db.transaction(async (tx) => {
			logger.info({ msg: 'Editing schedule slot', slotId, data });

			// Prepare update data (omit platforms for separate handling)
			const updateData = _.omit(data, ['platforms']);

			// Update the slot
			await tx
				.update(schema.scheduleSlot)
				.set(updateData)
				.where(eq(schema.scheduleSlot.scheduleSlotId, slotId));

			// Handle platforms: delete all existing, then insert new ones
			await tx
				.delete(schema.scheduleSlotPlatform)
				.where(eq(schema.scheduleSlotPlatform.scheduleSlotId, slotId));

			if (data.platforms.length > 0) {
				const platformAssociations = data.platforms.map((p) => ({
					scheduleSlotId: slotId,
					platformId: p.platformId
				}));
				await tx.insert(schema.scheduleSlotPlatform).values(platformAssociations);
			}

			logger.info({ msg: 'Schedule slot edited successfully' });
		});

		return { success: true };
	} catch (e) {
		logger.error({ msg: 'Error editing schedule slot', error: e, slotId, data });
		return { success: false, error: e };
	}
}
