import { type RequestHandler, json, error } from '@sveltejs/kit';
import { logger } from '$lib/server/logger';
import { db, schema, eq, and, inArray } from '$lib/server/db';
import _ from 'lodash';
import { addDays, format, startOfDay } from 'date-fns';
import { parseEpisodeList } from '$lib/util/schedule/episodeProgressParser';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	const SCHEDULE_SYNC_EPISODES = env.VITE_SCHEDULE_SYNC_EPISODES;
	const xScheduleSyncEpisodes = request.headers.get('x-schedule-sync-episodes');

	if (!SCHEDULE_SYNC_EPISODES) {
		logger.error('VITE_SCHEDULE_SYNC_EPISODES environment variable is not set');
		return error(500, 'Server error');
	}

	if (xScheduleSyncEpisodes !== SCHEDULE_SYNC_EPISODES) {
		logger.warn('Unauthorized attempt to sync schedule episodes');
		return error(401, 'Unauthorized');
	}

	const body = await request.json().catch(() => ({}));
	const { date } = body as { date?: string };

	const now = new Date();
	const today = format(startOfDay(now), 'yyyy-MM-dd');
	const sync = date ?? format(addDays(startOfDay(now), -1), 'yyyy-MM-dd');

	if (sync >= today) {
		logger.warn(`Rejected sync attempt for non-past date: ${sync}`);
		return error(400, 'date must be before today');
	}

	const entries = await db
		.select({
			entry: schema.scheduleEntry,
			season: schema.scheduleEntryAnimeSeason
		})
		.from(schema.scheduleEntry)
		.innerJoin(
			schema.scheduleEntryAnimeSeason,
			eq(schema.scheduleEntry.scheduleEntryId, schema.scheduleEntryAnimeSeason.scheduleEntryId)
		)
		.where(
			and(
				eq(schema.scheduleEntry.date, sync),
				eq(schema.scheduleEntry.type, 'anime'),
				eq(schema.scheduleEntry.isCancelled, false)
			)
		);

	if (!entries || entries.length === 0) {
		logger.info(`No schedule entries found for date ${sync}`);
		return json({ success: true, message: `No schedule entries found for date ${sync}` });
	}

	const groupedBySeason = _.groupBy(entries, (entry) => entry.season.animeSeasonId);
	const uniqueSeasons = new Set(Object.keys(groupedBySeason));

	const animeSeasons = await db
		.select()
		.from(schema.animeSeason)
		.where(inArray(schema.animeSeason.animeSeasonId, Array.from(uniqueSeasons)));

	await db.transaction(async (tx) => {
		for (const [k, v] of Object.entries(groupedBySeason)) {
			const episodes = v.map((entry) => parseEpisodeList(entry.season.episodes));
			const maxEp = Math.max(...episodes.flat());
			const progress = animeSeasons.find((season) => season.animeSeasonId === k)?.episodeProgress;

			if (maxEp > 0 && progress !== undefined && progress < maxEp) {
				await tx
					.update(schema.animeSeason)
					.set({ episodeProgress: maxEp })
					.where(eq(schema.animeSeason.animeSeasonId, k));
			}
		}
	});

	return json({
		success: true,
		message: `Updated progress for ${Object.entries(groupedBySeason).length} anime season(s) for date ${sync}`
	});
};
