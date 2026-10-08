import { command } from '$app/server';
import { z } from 'zod/v4';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { requireStaff } from '$lib/server/auth';
import { AppError, ERROR_CODES } from '$lib/errors';
import { logger } from '$lib/server/logger';
import { AddScheduleSlotSchema, EditScheduleSlotSchema } from '$lib/schemas';

/** Schedule slot admin operations. */

const UpdateScheduleSlotSchema = EditScheduleSlotSchema.extend({ slotId: z.uuid() });
const ToggleScheduleSlotSchema = z.object({ slotId: z.uuid(), isActive: z.boolean() });
const DeleteScheduleSlotSchema = z.object({ slotId: z.uuid() });

export const createScheduleSlot = command(AddScheduleSlotSchema, async (data) => {
	await requireStaff();

	try {
		await db.transaction(async (tx) => {
			const { duplicateToDays, platforms, ...pureSlot } = data;

			const days = [...new Set([data.dayOfWeek, ...duplicateToDays])].sort((a, b) => a - b);

			const slots = days.map((day) => ({ ...pureSlot, dayOfWeek: day }));

			const insertedSlots = await tx.insert(schema.scheduleSlot).values(slots).returning();

			if (platforms.length > 0) {
				await tx.insert(schema.scheduleSlotPlatform).values(
					insertedSlots.flatMap((slot) =>
						platforms.map((p) => ({
							scheduleSlotId: slot.scheduleSlotId,
							platformId: p.platformId
						}))
					)
				);
			}
		});
	} catch (err) {
		throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
			cause: err,
			context: { action: 'createScheduleSlot' }
		});
	}

	return { success: true as const };
});

export const updateScheduleSlot = command(UpdateScheduleSlotSchema, async (data) => {
	await requireStaff();

	const { slotId, platforms, ...updateData } = data;

	try {
		await db.transaction(async (tx) => {
			await tx
				.update(schema.scheduleSlot)
				.set(updateData)
				.where(eq(schema.scheduleSlot.scheduleSlotId, slotId));

			await tx
				.delete(schema.scheduleSlotPlatform)
				.where(eq(schema.scheduleSlotPlatform.scheduleSlotId, slotId));

			if (platforms.length > 0) {
				await tx.insert(schema.scheduleSlotPlatform).values(
					platforms.map((p) => ({
						scheduleSlotId: slotId,
						platformId: p.platformId
					}))
				);
			}
		});
	} catch (err) {
		throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
			cause: err,
			context: { action: 'updateScheduleSlot', slotId }
		});
	}

	return { success: true as const };
});

export const toggleScheduleSlot = command(ToggleScheduleSlotSchema, async (data) => {
	await requireStaff();

	try {
		await db
			.update(schema.scheduleSlot)
			.set({ isActive: data.isActive })
			.where(eq(schema.scheduleSlot.scheduleSlotId, data.slotId));

		logger.info('toggleScheduleSlot', { slotId: data.slotId, isActive: data.isActive });
	} catch (err) {
		throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
			cause: err,
			context: { action: 'toggleScheduleSlot', slotId: data.slotId }
		});
	}

	return { success: true as const };
});

export const deleteScheduleSlot = command(DeleteScheduleSlotSchema, async ({ slotId }) => {
	await requireStaff();

	try {
		await db.delete(schema.scheduleSlot).where(eq(schema.scheduleSlot.scheduleSlotId, slotId));

		logger.info('deleteScheduleSlot', { slotId });
	} catch (err) {
		throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
			cause: err,
			context: { action: 'deleteScheduleSlot', slotId }
		});
	}

	return { success: true as const };
});
