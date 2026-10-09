import { type RequestHandler, json, error } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { env } from '$env/dynamic/private';
import { isBotRequest } from '$lib/server/botAuth';
import { findLinkedUserByDiscordId } from '$lib/server/discord/link';
import { logger } from '$lib/server/logger';

const VerifyBodySchema = z.object({
	discordId: z.string().regex(/^\d{17,20}$/, 'discordId must be a Discord snowflake')
});

/** Bot-only Discord link lookup. */
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	if (!env.BOT_API_TOKEN) {
		logger.error('BOT_API_TOKEN environment variable is not set');
		throw error(500, 'Server error');
	}

	if (!isBotRequest(request)) {
		logger.warn('Unauthorized attempt to use the bot API');
		throw error(401, 'Unauthorized');
	}

	if (!checkVerifyRateLimit(getClientAddress())) {
		throw error(429, 'Too many requests');
	}

	const parsed = VerifyBodySchema.safeParse(await request.json().catch(() => ({})));

	if (!parsed.success) {
		throw error(400, 'Invalid request body');
	}

	const user = await findLinkedUserByDiscordId(parsed.data.discordId);

	return json(user ? { linked: true, user } : { linked: false });
};

const verifyAttempts = new Map<string, number[]>();
const VERIFY_LIMIT = 60;
const VERIFY_WINDOW_MS = 60_000;

/**
 * Sliding-window limiter for the bot verify endpoint.
 * @param ip - Client ip.
 * @returns True when allowed.
 */
function checkVerifyRateLimit(ip: string): boolean {
	const now = Date.now();
	const attempts = (verifyAttempts.get(ip) ?? []).filter((t) => now - t < VERIFY_WINDOW_MS);
	if (attempts.length >= VERIFY_LIMIT) {
		verifyAttempts.set(ip, attempts);
		return false;
	}
	attempts.push(now);
	verifyAttempts.set(ip, attempts);
	if (verifyAttempts.size > 1000) {
		const oldest = [...verifyAttempts.entries()].sort((a, b) => (a[1][0] ?? 0) - (b[1][0] ?? 0))[0];
		if (oldest) verifyAttempts.delete(oldest[0]);
	}
	return true;
}
