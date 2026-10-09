import { type RequestHandler, json, error } from '@sveltejs/kit';
import { logger } from '$lib/server/logger';
import { db, schema, eq, and, inArray } from '$lib/server/db';
import { addDays, format, startOfDay } from 'date-fns';
import { parseEpisodeList } from '$lib/util/schedule/episodeProgressParser';
import { env } from '$env/dynamic/private';
import { z } from 'zod/v4';
import { timingSafeEqual, createHash } from 'node:crypto';

/** Constant-time comparison of the cron secret to avoid a timing oracle. */
function secretsMatch(provided: string | null, expected: string): boolean {
	if (!provided || !expected) return false;

	// Hash both sides so the comparison is always 32 bytes; comparing raw
	// buffers of different lengths would early-return and leak the length.
	const a = createHash('sha256').update(provided).digest();
	const b = createHash('sha256').update(expected).digest();

	return timingSafeEqual(a, b);
}

const SyncBodySchema = z.object({
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
		.refine((value) => !Number.isNaN(Date.parse(value)), 'date must be a real calendar date')
		.optional()
});

export const POST: RequestHandler = async ({ request }) => {
	const SCHEDULE_SYNC_EPISODES = env.SCHEDULE_SYNC_EPISODES;
	const xScheduleSyncEpisodes = request.headers.get('x-schedule-sync-episodes');

	if (!SCHEDULE_SYNC_EPISODES) {
		logger.error('SCHEDULE_SYNC_EPISODES environment variable is not set');
		throw error(500, 'Server error');
	}

	if (!secretsMatch(xScheduleSyncEpisodes, SCHEDULE_SYNC_EPISODES)) {
		logger.warn('Unauthorized attempt to sync schedule episodes');
		throw error(401, 'Unauthorized');
	}

	const parsed = SyncBodySchema.safeParse(await request.json().catch(() => ({})));

	if (!parsed.success) {
		logger.warn('Rejected schedule sync with invalid body', {
			issues: parsed.error.issues
		});
		throw error(400, 'Invalid request body');
	}

	const { date } = parsed.data;

	const now = new Date();
	const today = format(startOfDay(now), 'yyyy-MM-dd');
	const sync = date ?? format(addDays(startOfDay(now), -1), 'yyyy-MM-dd');

	if (sync >= today) {
		logger.warn(`Rejected sync attempt for non-past date: ${sync}`);
		throw error(400, 'date must be before today');
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

	const groupedBySeason = Object.groupBy(entries, (entry) => entry.season.animeSeasonId);
	const uniqueSeasons = new Set(Object.keys(groupedBySeason));

	const animeSeasons = await db
		.select()
		.from(schema.animeSeason)
		.where(inArray(schema.animeSeason.animeSeasonId, Array.from(uniqueSeasons)));

	await db.transaction(async (tx) => {
		for (const [k, v] of Object.entries(groupedBySeason)) {
			const flat = (v ?? [])
				.flatMap((entry) => parseEpisodeList(entry.season.episodes))
				.filter((n) => Number.isFinite(n));
			if (flat.length === 0) continue;

			const maxEp = Math.max(...flat);
			const progress = animeSeasons.find((season) => season.animeSeasonId === k)?.episodeProgress;

			if (progress !== undefined && progress < maxEp) {
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
