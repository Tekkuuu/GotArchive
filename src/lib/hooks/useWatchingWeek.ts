import { schema, db } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import _ from 'lodash';
import { parseEpisodeList } from '$lib/util/schedule/episodeProgressParser';

export async function useWatchingWeek(datecode: string) {
	// Check if id has a valid structure
	if (datecode.length < 6) {
		throw new Error('Invalid datecode');
	}

	const year = Number(datecode.substring(0, 4));
	const week = Number(datecode.substring(4));

	// Check if converted year and week values are valid numbers
	if (!Number.isFinite(year) || !Number.isFinite(week)) {
		throw new Error('Invalid datecode');
	}

	// Check if year and week are positive values
	if (year < 1900 || year > new Date().getFullYear() + 10 || week < 0 || week > 53) {
		throw new Error('Invalid datecode');
	}

	const watchingRaw = await db
		.select({
			animeSeasonId: schema.animeSeason.animeSeasonId,
			animeId: schema.animeSeason.animeId,
			titles: {
				native: schema.animeSeason.titleNative,
				romaji: schema.animeSeason.titleRomaji,
				english: schema.animeSeason.titleEnglish
			},
			description: schema.scheduleEntry.description
		})
		.from(schema.schedule)
		.innerJoin(
			schema.scheduleEntry,
			eq(schema.schedule.scheduleId, schema.scheduleEntry.scheduleId)
		)
		.innerJoin(
			schema.animeSeason,
			eq(schema.scheduleEntry.animeSeasonId, schema.animeSeason.animeSeasonId)
		)
		.where(and(eq(schema.schedule.year, year), eq(schema.schedule.week, week)))
		.orderBy(
			schema.scheduleEntry.date,
			schema.scheduleEntry.time,
			schema.animeSeason.animeSeasonId
		);

	const grouped = _.groupBy(watchingRaw, 'animeSeasonId');

	const watching = Object.values(grouped).map((entries) => {
		const first = entries[0];

		// Collect all episodes from all schedule entries for this animeSeason
		const allEpisodes: number[] = [];
		for (const entry of entries) {
			const episodes = parseEpisodeList(entry.description);
			allEpisodes.push(...episodes);
		}
		const uniqueEpisodes = _.uniq(allEpisodes).sort((a, b) => a - b);

		return {
			animeSeasonId: first.animeSeasonId,
			animeId: first.animeId,
			titles: first.titles,
			episodes: uniqueEpisodes
		};
	});

	return watching;
}
