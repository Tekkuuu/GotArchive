import { and, eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { formatIsoWeekLine } from '$lib/util/dateUtils';
import { AppError, ERROR_CODES } from '$lib/errors';
import { logger } from '$lib/server/logger';
import { callScheduleUpdated } from './botApi';

export type SendUpdateResult =
	| { ok: true; messageId: string; label: string }
	| { ok: false; status: number; message: string };

/**
 * Sends or refreshes the announcement for one target, then stores the message ids.
 * @param scheduleId - Schedule id.
 * @param targetId - Target id.
 * @returns Send result.
 */
export async function sendScheduleUpdateToTarget(
	scheduleId: string,
	targetId: string
): Promise<SendUpdateResult> {
	const [schedule] = await db
		.select()
		.from(schema.schedule)
		.where(eq(schema.schedule.scheduleId, scheduleId))
		.limit(1);

	if (!schedule) return { ok: false, status: 404, message: 'Schedule not found' };

	const [target] = await db
		.select()
		.from(schema.discordTarget)
		.where(eq(schema.discordTarget.targetId, targetId))
		.limit(1);

	if (!target) return { ok: false, status: 404, message: 'Discord target not found' };

	const [mapping] = await db
		.select()
		.from(schema.discordScheduleMessage)
		.where(
			and(
				eq(schema.discordScheduleMessage.scheduleId, scheduleId),
				eq(schema.discordScheduleMessage.targetId, targetId)
			)
		)
		.limit(1);

	const datecode = `${schedule.year}${String(schedule.week).padStart(2, '0')}`;
	const weekLabel = formatIsoWeekLine(schedule.year, schedule.week);

	let results;
	try {
		results = await callScheduleUpdated({
			scheduleId,
			datecode,
			weekLabel,
			targets: [
				{
					targetId: target.targetId,
					guildId: target.guildId,
					channelId: target.channelId,
					timeZone: target.timeZone,
					mentionType: target.mentionType,
					mentionRoleId: target.mentionRoleId,
					messageId: mapping?.messageId ?? null,
					pingMessageId: mapping?.pingMessageId ?? null
				}
			]
		});
	} catch (err) {
		logger.error('sendScheduleUpdateToTarget: bot call failed', {
			scheduleId,
			targetId,
			error: err instanceof Error ? err.message : String(err)
		});
		return { ok: false, status: 502, message: 'Could not reach the bot. Is it running?' };
	}

	const result = results.find((r) => r.targetId === targetId);
	if (!result || !result.ok) {
		const message = result && !result.ok ? result.error : 'The bot returned no result.';
		logger.error('sendScheduleUpdateToTarget: bot reported failure', {
			scheduleId,
			targetId,
			error: message
		});
		return { ok: false, status: 502, message };
	}

	const now = new Date();
	try {
		if (mapping) {
			await db
				.update(schema.discordScheduleMessage)
				.set({
					messageId: result.messageId,
					pingMessageId: result.pingMessageId,
					lastSentAt: now,
					updatedAt: now
				})
				.where(eq(schema.discordScheduleMessage.scheduleMessageId, mapping.scheduleMessageId));
		} else {
			await db.insert(schema.discordScheduleMessage).values({
				scheduleId,
				targetId,
				messageId: result.messageId,
				pingMessageId: result.pingMessageId,
				lastSentAt: now
			});
		}
	} catch (err) {
		throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
			cause: err,
			context: { action: 'sendScheduleUpdateToTarget:storeMapping', scheduleId, targetId }
		});
	}

	return { ok: true, messageId: result.messageId, label: target.label };
}
