import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { schema, db, eq, and, sql, asc } from '$lib/server/db';
import { logger } from '$lib/server/logger';
import { formatWeekRange } from '$lib/util/dateUtils';
import { getISOWeek, getISOWeekYear, parseISO } from 'date-fns';
import type { SchedulePageData } from './types';
import type {
	ScheduleEntryData,
	ScheduleAnimeSeasonInfo,
	SchedulePlatformInfo
} from '$lib/api/schedule/datecode';

export const load: PageServerLoad = async () => {
	// Get current week and year
	const now = new Date();
	const currentYear = getISOWeekYear(now);
	const currentWeek = getISOWeek(now);

	try {
		// Fetch schedule (excluding preview schedules)
		const [scheduleData] = await db
			.select()
			.from(schema.schedule)
			.where(
				and(
					eq(schema.schedule.year, currentYear),
					eq(schema.schedule.week, currentWeek),
					eq(schema.schedule.preview, false)
				)
			)
			.limit(1);

		if (!scheduleData) {
			// Return empty data structure instead of throwing error
			return {
				schedule: null,
				weekRange: formatWeekRange(currentYear, currentWeek),
				entries: [],
				currentYear,
				currentWeek
			} satisfies SchedulePageData;
		}

		// Fetch entries with anime seasons using CTE to avoid Cartesian product
		const entryAnime = db.$with('entry_anime').as(
			db
				.select({
					scheduleEntryId: schema.scheduleEntry.scheduleEntryId,
					animeSeasons: sql<Array<{
						animeSeasonId: string;
						episodes: string;
						format: string;
						season: string | null;
						year: number | null;
						titleNative: string;
						titleRomaji: string | null;
						titleEnglish: string | null;
						shortTitle: string | null;
						animeId: string;
						animeTitleNative: string;
						animeTitleRomaji: string | null;
						animeTitleEnglish: string | null;
						animeShortTitle: string | null;
						animeLogoUrl: string | null;
					}> | null>`json_agg(
            json_build_object(
              'animeSeasonId', ${schema.scheduleEntryAnimeSeason.animeSeasonId},
              'episodes', ${schema.scheduleEntryAnimeSeason.episodes},
              'format', ${schema.animeSeason.format},
              'season', ${schema.animeSeason.season},
              'year', ${schema.animeSeason.year},
              'titleNative', ${schema.animeSeason.titleNative},
              'titleRomaji', ${schema.animeSeason.titleRomaji},
              'titleEnglish', ${schema.animeSeason.titleEnglish},
              'shortTitle', ${schema.animeSeason.shortTitle},
              'animeId', ${schema.anime.animeId},
              'animeTitleNative', ${schema.anime.titleNative},
              'animeTitleRomaji', ${schema.anime.titleRomaji},
              'animeTitleEnglish', ${schema.anime.titleEnglish},
              'animeShortTitle', ${schema.anime.shortTitle},
              'animeLogoUrl', ${schema.anime.logoUrl}
            )
            ORDER BY ${schema.scheduleEntryAnimeSeason.animeSeasonId}
          ) FILTER (WHERE ${schema.scheduleEntryAnimeSeason.animeSeasonId} IS NOT NULL)`.as(
						'animeSeasons'
					)
				})
				.from(schema.scheduleEntry)
				.leftJoin(
					schema.scheduleEntryAnimeSeason,
					eq(schema.scheduleEntry.scheduleEntryId, schema.scheduleEntryAnimeSeason.scheduleEntryId)
				)
				.leftJoin(
					schema.animeSeason,
					eq(schema.scheduleEntryAnimeSeason.animeSeasonId, schema.animeSeason.animeSeasonId)
				)
				.leftJoin(schema.anime, eq(schema.animeSeason.animeId, schema.anime.animeId))
				.where(eq(schema.scheduleEntry.scheduleId, scheduleData.scheduleId))
				.groupBy(schema.scheduleEntry.scheduleEntryId)
		);

		// Fetch platforms using CTE
		const entryPlatforms = db.$with('entry_platforms').as(
			db
				.select({
					scheduleEntryId: schema.scheduleEntry.scheduleEntryId,
					platforms: sql<Array<{
						platformId: string;
						name: string;
						url: string;
					}> | null>`json_agg(
            json_build_object(
              'platformId', ${schema.platform.platformId},
              'name', ${schema.platform.name},
              'url', ${schema.platform.url}
            )
            ORDER BY ${schema.platform.name}
          ) FILTER (WHERE ${schema.platform.platformId} IS NOT NULL)`.as('platforms')
				})
				.from(schema.scheduleEntry)
				.leftJoin(
					schema.scheduleEntryPlatform,
					eq(schema.scheduleEntry.scheduleEntryId, schema.scheduleEntryPlatform.scheduleEntryId)
				)
				.leftJoin(
					schema.platform,
					eq(schema.scheduleEntryPlatform.platformId, schema.platform.platformId)
				)
				.where(eq(schema.scheduleEntry.scheduleId, scheduleData.scheduleId))
				.groupBy(schema.scheduleEntry.scheduleEntryId)
		);

		// Combine everything
		const entries = await db
			.with(entryAnime, entryPlatforms)
			.select({
				entry: schema.scheduleEntry,
				animeSeasons: entryAnime.animeSeasons,
				platforms: entryPlatforms.platforms
			})
			.from(schema.scheduleEntry)
			.leftJoin(entryAnime, eq(schema.scheduleEntry.scheduleEntryId, entryAnime.scheduleEntryId))
			.leftJoin(
				entryPlatforms,
				eq(schema.scheduleEntry.scheduleEntryId, entryPlatforms.scheduleEntryId)
			)
			.where(eq(schema.scheduleEntry.scheduleId, scheduleData.scheduleId))
			.orderBy(asc(schema.scheduleEntry.date), asc(schema.scheduleEntry.time));

		// Format entries
		const formattedEntries: ScheduleEntryData[] = entries.map((entryData) => {
			const entry = entryData.entry;
			const date = parseISO(entry.date);
			const dayOfWeek = date.getDay();
			// Adjust day: Sunday (0) becomes 6, Monday (1) becomes 0
			const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

			// Format anime seasons
			const animeSeasons: ScheduleAnimeSeasonInfo[] =
				entryData.animeSeasons?.map((as) => ({
					animeSeasonId: as.animeSeasonId,
					episodes: as.episodes,
					anime: {
						animeId: as.animeId,
						titleNative: as.animeTitleNative,
						titleRomaji: as.animeTitleRomaji,
						titleEnglish: as.animeTitleEnglish,
						shortTitle: as.animeShortTitle,
						logoUrl: as.animeLogoUrl
					},
					format: as.format,
					season: as.season,
					year: as.year,
					titleNative: as.titleNative,
					titleRomaji: as.titleRomaji,
					titleEnglish: as.titleEnglish,
					shortTitle: as.shortTitle
				})) || [];

			// Format platforms
			const platforms: SchedulePlatformInfo[] =
				entryData.platforms?.map((p) => ({
					platformId: p.platformId,
					name: p.name,
					url: p.url
				})) || [];

			return {
				scheduleEntryId: entry.scheduleEntryId,
				date: entry.date,
				dayOfWeek: adjustedDay,
				time: entry.time,
				type: entry.type,
				title: entry.title,
				description: entry.description,
				logoUrl: entry.logoUrl,
				note: entry.note,
				isCancelled: entry.isCancelled,
				cancelledText: entry.cancelledText,
				animeSeasons,
				platforms
			};
		});

		// Return page data
		const pageData: SchedulePageData = {
			schedule: {
				scheduleId: scheduleData.scheduleId,
				year: scheduleData.year,
				week: scheduleData.week,
				note: scheduleData.note,
				preview: scheduleData.preview
			},
			weekRange: formatWeekRange(scheduleData.year, scheduleData.week),
			entries: formattedEntries,
			currentYear: scheduleData.year,
			currentWeek: scheduleData.week
		};

		return pageData;
	} catch (err) {
		logger.error('Failed to load schedule page', {
			error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err)
		});
		throw error(500, {
			message: 'Failed to load schedule'
		});
	}
};
