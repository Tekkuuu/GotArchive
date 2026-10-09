import { type RequestHandler, json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { isBotRequest } from '$lib/server/botAuth';
import { requireDiscordStaff } from '$lib/server/discord/permissions';
import { listEntryChoices } from '$lib/server/discord/entries';
import { logger } from '$lib/server/logger';

/** Bot-only, staff-only. Lists entry choices for autocomplete, including drafts. */
export const GET: RequestHandler = async ({ request, url }) => {
	if (!env.BOT_API_TOKEN) {
		logger.error('BOT_API_TOKEN environment variable is not set');
		return error(500, 'Server error');
	}

	if (!isBotRequest(request)) {
		logger.warn('Unauthorized attempt to use the bot entries API');
		return error(401, 'Unauthorized');
	}

	const discordId = url.searchParams.get('discordId');
	const staff = discordId ? await requireDiscordStaff(discordId) : null;

	if (!staff) {
		logger.warn('Unauthorized bot entries access', { discordId });
		return error(403, 'Forbidden');
	}

	const entries = await listEntryChoices(url.searchParams.get('datecode'));

	return json({ entries });
};
