import { type RequestHandler, json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { isBotRequest } from '$lib/server/botAuth';
import { currentDatecode } from '$lib/server/discord/entries';
import { getScheduleByWeek, parseDatecode } from '$lib/server/schedule/queries';
import { applyTimezone, parseTzParam } from '$lib/api/schedule/timezone';
import type { ScheduleEntryData } from '$lib/api/schedule/datecode';
import { logger } from '$lib/server/logger';

function todayInZone(timeZone: string): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(new Date());
}

function entryEpoch(entry: ScheduleEntryData): number | null {
	if (!entry.date || !entry.time) return null;
	const [y, m, d] = entry.date.split('-').map(Number);
	const [hh, mm, ss] = entry.time.split(':').map(Number);
	if ([y, m, d, hh, mm].some(Number.isNaN)) return null;
	return Math.floor(Date.UTC(y, m - 1, d, hh, mm, ss || 0) / 1000);
}

function displayTitle(entry: ScheduleEntryData): string {
	const anime = entry.animeSeasons[0];
	return (
		entry.title ||
		anime?.shortTitle ||
		anime?.titleEnglish ||
		anime?.titleRomaji ||
		anime?.titleNative ||
		'Untitled'
	);
}

/** Bot-only. Returns today's entries for a timezone with UTC epoch times. */
export const GET: RequestHandler = async ({ request, url }) => {
	if (!env.BOT_API_TOKEN) {
		logger.error('BOT_API_TOKEN environment variable is not set');
		return error(500, 'Server error');
	}
	if (!isBotRequest(request)) {
		logger.warn('Unauthorized attempt to use the bot today API');
		return error(401, 'Unauthorized');
	}

	const timeZone = parseTzParam(url.searchParams.get('tz')) ?? 'Europe/London';
	const today = todayInZone(timeZone);

	const parsed = parseDatecode(currentDatecode());
	const data = parsed ? await getScheduleByWeek(parsed.year, parsed.week) : null;

	const entries = (data?.entries ?? [])
		.map((entry) => ({ entry, adjusted: applyTimezone(entry, timeZone) }))
		.filter(({ adjusted }) => adjusted.date === today)
		.map(({ entry }) => ({
			id: entry.scheduleEntryId,
			title: displayTitle(entry),
			epoch: entryEpoch(entry),
			cancelled: entry.isCancelled,
			platforms: entry.platforms.map((platform) => ({
				name: platform.name,
				url: platform.url
			}))
		}));

	return json({ date: today, timeZone, entries });
};
