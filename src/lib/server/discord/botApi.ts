import { env } from '$env/dynamic/private';

/** A Discord channel to announce a schedule in. */
export interface BotTarget {
	targetId: string;
	guildId: string;
	channelId: string;
	timeZone: string;
	mentionType: 'none' | 'everyone' | 'role';
	mentionRoleId: string | null;
	messageId: string | null;
	pingMessageId: string | null;
}

/** Body of `POST /schedule-updated` on the bot. */
export interface ScheduleUpdatedRequest {
	scheduleId: string;
	datecode: string;
	weekLabel: string;
	targets: BotTarget[];
}

export type BotTargetResult =
	| { targetId: string; ok: true; messageId: string; pingMessageId: string }
	| { targetId: string; ok: false; error: string };

/**
 * Calls the bot schedule-updated endpoint.
 * @param request - Schedule update.
 * @param timeoutMs - Fetch timeout in milliseconds.
 * @returns Per-target results.
 */
export async function callScheduleUpdated(
	request: ScheduleUpdatedRequest,
	timeoutMs = 15_000
): Promise<BotTargetResult[]> {
	const baseUrl = env.BOT_BASE_URL;
	const token = env.BOT_API_TOKEN;

	if (!baseUrl || !token) {
		throw new Error('BOT_BASE_URL / BOT_API_TOKEN are not configured');
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(`${baseUrl.replace(/\/$/, '')}/schedule-updated`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'x-bot-token': token
			},
			body: JSON.stringify(request),
			signal: controller.signal
		});

		if (!res.ok) {
			const body = (await res.text().catch(() => '')).slice(0, 500);
			throw new Error(`Bot API responded with ${res.status}${body ? `: ${body}` : ''}`);
		}

		let json: unknown;
		try {
			json = await res.json();
		} catch {
			throw new Error('Bot API returned a non-JSON response');
		}
		const results = (json as { results?: BotTargetResult[] }).results;
		if (!Array.isArray(results)) return [];
		return results;
	} catch (err) {
		if (err instanceof DOMException && err.name === 'AbortError') {
			throw new Error(`Bot API timed out after ${timeoutMs}ms`);
		}
		throw err;
	} finally {
		clearTimeout(timeout);
	}
}
