import { type RequestHandler, json, error } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { isBotRequest } from '$lib/server/botAuth';
import { requireDiscordStaff } from '$lib/server/discord/permissions';
import { getEntryLabel } from '$lib/server/discord/entries';
import { db, schema } from '$lib/server/db';
import { logger } from '$lib/server/logger';

const CancelBodySchema = z.object({
	discordId: z.string().regex(/^\d{17,20}$/, 'discordId must be a Discord snowflake'),
	scheduleEntryId: z.uuid(),
	isCancelled: z.boolean().optional(),
	reason: z.string().max(1000).nullable().optional()
});

/** Bot-only. Cancels or un-cancels an entry for a linked staff user. */
export const POST: RequestHandler = async ({ request }) => {
	if (!env.BOT_API_TOKEN) {
		logger.error('BOT_API_TOKEN environment variable is not set');
		return error(500, 'Server error');
	}

	if (!isBotRequest(request)) {
		logger.warn('Unauthorized attempt to use the bot cancel API');
		return error(401, 'Unauthorized');
	}

	const parsed = CancelBodySchema.safeParse(await request.json().catch(() => ({})));

	if (!parsed.success) {
		return error(400, 'Invalid request body');
	}

	const { discordId, scheduleEntryId, isCancelled, reason } = parsed.data;

	const staff = await requireDiscordStaff(discordId);

	if (!staff) {
		logger.warn('Unauthorized /cancel attempt', { discordId });
		return error(403, 'You do not have permission to cancel schedule entries.');
	}

	const [entry] = await db
		.select()
		.from(schema.scheduleEntry)
		.where(eq(schema.scheduleEntry.scheduleEntryId, scheduleEntryId))
		.limit(1);

	if (!entry) {
		return error(404, 'Schedule entry not found.');
	}

	const nextState = isCancelled ?? !entry.isCancelled;

	await db
		.update(schema.scheduleEntry)
		.set({
			isCancelled: nextState,
			cancelledText: nextState ? (reason ?? entry.cancelledText) : null
		})
		.where(eq(schema.scheduleEntry.scheduleEntryId, scheduleEntryId));

	logger.info(nextState ? 'cancelEntry via Discord' : 'uncancelEntry via Discord', {
		scheduleEntryId,
		actorId: staff.id,
		discordId
	});

	const label = await getEntryLabel(scheduleEntryId);

	return json({
		success: true,
		entry: { id: scheduleEntryId, label, isCancelled: nextState }
	});
};
