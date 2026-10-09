import { type RequestHandler, json, error } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { and, eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { isBotRequest } from '$lib/server/botAuth';
import { requireDiscordStaff } from '$lib/server/discord/permissions';
import { sendScheduleUpdateToTarget } from '$lib/server/discord/sendUpdate';
import { parseDatecode } from '$lib/server/schedule/queries';
import { db, schema } from '$lib/server/db';
import { logger } from '$lib/server/logger';

const BodySchema = z.object({
	discordId: z.string().regex(/^\d{17,20}$/, 'discordId must be a Discord snowflake'),
	datecode: z.string().regex(/^\d{6}$/, 'datecode must be YYYYWW'),
	targetId: z.uuid()
});

/** Bot-only. Sends or edits the announcement for one target. */
export const POST: RequestHandler = async ({ request }) => {
	if (!env.BOT_API_TOKEN) {
		logger.error('BOT_API_TOKEN environment variable is not set');
		return error(500, 'Server error');
	}
	if (!isBotRequest(request)) {
		logger.warn('Unauthorized attempt to use the bot send-update API');
		return error(401, 'Unauthorized');
	}

	const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
	if (!parsed.success) {
		return error(400, 'Invalid request body');
	}

	const { discordId, datecode, targetId } = parsed.data;

	const staff = await requireDiscordStaff(discordId);
	if (!staff) {
		logger.warn('Unauthorized /send-update attempt', { discordId });
		return error(403, 'You do not have permission to send schedule updates.');
	}

	const week = parseDatecode(datecode);
	if (!week) {
		return error(400, 'Invalid datecode.');
	}

	const [schedule] = await db
		.select()
		.from(schema.schedule)
		.where(and(eq(schema.schedule.year, week.year), eq(schema.schedule.week, week.week)))
		.limit(1);

	if (!schedule) {
		return error(404, 'No schedule exists for that week.');
	}

	const result = await sendScheduleUpdateToTarget(schedule.scheduleId, targetId);
	if (!result.ok) {
		return error(result.status, result.message);
	}

	return json({ success: true, messageId: result.messageId, label: result.label });
};
