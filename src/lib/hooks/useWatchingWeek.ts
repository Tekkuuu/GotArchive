import { schema, db } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import { groupBy, uniq } from 'lodash-es';
import { parseEpisodeList } from '$lib/util/schedule/episodeProgressParser';
import { parseDatecode } from '$lib/server/schedule/queries';
import { AppError, ERROR_CODES } from '$lib/errors';

export async function useWatchingWeek(datecode: string) {
	const parsed = parseDatecode(datecode);
	if (!parsed) {
		throw new AppError(ERROR_CODES.schedule.DATECODE_INVALID, { context: { datecode } });
	}

	const { year, week } = parsed;

	const watchingRaw = await db
		.select({
			animeSeasonId: schema.animeSeason.animeSeasonId,
			animeId: schema.animeSeason.animeId,
			titles: {
				native: schema.animeSeason.titleNative,
				romaji: schema.animeSeason.titleRomaji,
				english: schema.animeSeason.titleEnglish
			},
			anilistId: schema.animeSeasonMetadata.anilistId,
			malId: schema.animeSeasonMetadata.malId,
			episodes: schema.scheduleEntryAnimeSeason.episodes
		})
		.from(schema.schedule)
		.innerJoin(
			schema.scheduleEntry,
			eq(schema.schedule.scheduleId, schema.scheduleEntry.scheduleId)
		)
		.innerJoin(
			schema.scheduleEntryAnimeSeason,
			eq(schema.scheduleEntry.scheduleEntryId, schema.scheduleEntryAnimeSeason.scheduleEntryId)
		)
		.innerJoin(
			schema.animeSeason,
			eq(schema.scheduleEntryAnimeSeason.animeSeasonId, schema.animeSeason.animeSeasonId)
		)
		.leftJoin(
			schema.animeSeasonMetadata,
			eq(schema.animeSeason.animeSeasonId, schema.animeSeasonMetadata.animeSeasonId)
		)
		.where(
			and(
				eq(schema.schedule.year, year),
				eq(schema.schedule.week, week),
				eq(schema.schedule.preview, false)
			)
		)
		.orderBy(
			schema.scheduleEntry.date,
			schema.scheduleEntry.time,
			schema.animeSeason.animeSeasonId
		);

	const grouped = groupBy(watchingRaw, 'animeSeasonId');

	const watching = Object.values(grouped).map((entries) => {
		const first = entries[0];

		const allEpisodes: number[] = [];
		for (const entry of entries) {
			const episodes = parseEpisodeList(entry.episodes);
			allEpisodes.push(...episodes);
		}
		const uniqueEpisodes = uniq(allEpisodes).sort((a, b) => a - b);

		return {
			animeSeasonId: first.animeSeasonId,
			animeId: first.animeId,
			titles: first.titles,
			anilistId: first.anilistId,
			malId: first.malId,
			episodes: uniqueEpisodes
		};
	});

	return watching;
}
