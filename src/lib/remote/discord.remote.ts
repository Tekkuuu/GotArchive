import { command } from '$app/server';
import { error } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { requireStaff } from '$lib/server/auth';
import { AppError, ERROR_CODES } from '$lib/errors';
import { sendScheduleUpdateToTarget } from '$lib/server/discord/sendUpdate';

/** Discord announcement admin operations. */

const snowflake = z.string().regex(/^\d{17,20}$/, 'Must be a Discord id');
const MentionType = z.enum(['none', 'everyone', 'role']);

const TargetFields = z.object({
	guildId: snowflake,
	channelId: snowflake,
	label: z.string().trim().min(1, 'Label is required').max(100),
	timeZone: z.string().trim().min(1, 'Time zone is required').max(100),
	mentionType: MentionType.default('none'),
	mentionRoleId: snowflake.nullable().default(null),
	enabled: z.boolean().default(true)
});

const CreateTargetSchema = TargetFields;
const UpdateTargetSchema = TargetFields.extend({ targetId: z.uuid() });
const DeleteTargetSchema = z.object({ targetId: z.uuid() });
const SendScheduleUpdateSchema = z.object({ scheduleId: z.uuid(), targetId: z.uuid() });

function normaliseRole(data: z.infer<typeof TargetFields>): string | null {
	return data.mentionType === 'role' ? data.mentionRoleId : null;
}

function isUniqueViolation(err: unknown): boolean {
	return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
}

export const createDiscordTarget = command(CreateTargetSchema, async (data) => {
	await requireStaff();

	try {
		await db.insert(schema.discordTarget).values({
			guildId: data.guildId,
			channelId: data.channelId,
			label: data.label,
			timeZone: data.timeZone,
			mentionType: data.mentionType,
			mentionRoleId: normaliseRole(data),
			enabled: data.enabled
		});
	} catch (err) {
		if (isUniqueViolation(err)) {
			error(409, 'A target for that server and channel already exists.');
		}
		throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
			cause: err,
			context: { action: 'createDiscordTarget' }
		});
	}

	return { success: true as const };
});

export const updateDiscordTarget = command(UpdateTargetSchema, async (data) => {
	await requireStaff();

	try {
		await db
			.update(schema.discordTarget)
			.set({
				guildId: data.guildId,
				channelId: data.channelId,
				label: data.label,
				timeZone: data.timeZone,
				mentionType: data.mentionType,
				mentionRoleId: normaliseRole(data),
				enabled: data.enabled,
				updatedAt: new Date()
			})
			.where(eq(schema.discordTarget.targetId, data.targetId));
	} catch (err) {
		if (isUniqueViolation(err)) {
			error(409, 'A target for that server and channel already exists.');
		}
		throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
			cause: err,
			context: { action: 'updateDiscordTarget', targetId: data.targetId }
		});
	}

	return { success: true as const };
});

export const deleteDiscordTarget = command(DeleteTargetSchema, async ({ targetId }) => {
	await requireStaff();

	try {
		await db.delete(schema.discordTarget).where(eq(schema.discordTarget.targetId, targetId));
	} catch (err) {
		throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
			cause: err,
			context: { action: 'deleteDiscordTarget', targetId }
		});
	}

	return { success: true as const };
});

export const sendScheduleUpdate = command(
	SendScheduleUpdateSchema,
	async ({ scheduleId, targetId }) => {
		await requireStaff();

		const result = await sendScheduleUpdateToTarget(scheduleId, targetId);
		if (!result.ok) {
			error(result.status, result.message);
		}

		return { success: true as const, messageId: result.messageId };
	}
);
