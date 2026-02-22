import { schema, db, eq, and, sql, asc } from '$lib/server/db';
import { formatWeekRange } from '$lib/util/dateUtils';
import { parseISO } from 'date-fns';
import type {
	ScheduleData,
	ScheduleEntryData,
	ScheduleAnimeSeasonInfo,
	SchedulePlatformInfo
} from '$lib/api/schedule/datecode';

/**
 * Fetch and format a schedule by year + ISO week number.
 * Returns `null` when no non-preview schedule exists for that week.
 */
export async function getScheduleByWeek(year: number, week: number): Promise<ScheduleData | null> {
	const [scheduleData] = await db
		.select()
		.from(schema.schedule)
		.where(
			and(
				eq(schema.schedule.year, year),
				eq(schema.schedule.week, week),
				eq(schema.schedule.preview, false)
			)
		)
		.limit(1);

	if (!scheduleData) {
		return null;
	}

	// CTE: anime seasons per entry
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

	// CTE: platforms per entry
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

	// Combine
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

	const formattedEntries: ScheduleEntryData[] = entries.map((entryData) => {
		const entry = entryData.entry;
		const date = parseISO(entry.date);
		const dayOfWeek = date.getDay();
		// Adjust day: Sunday (0) becomes 6, Monday (1) becomes 0
		const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

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

	return {
		schedule: {
			scheduleId: scheduleData.scheduleId,
			year: scheduleData.year,
			week: scheduleData.week,
			note: scheduleData.note,
			preview: scheduleData.preview
		},
		weekRange: formatWeekRange(scheduleData.year, scheduleData.week),
		entries: formattedEntries
	};
}

/**
 * Parse a YYYYWW datecode string into { year, week }.
 * Returns `null` if the format is invalid.
 */
export function parseDatecode(datecode: string): { year: number; week: number } | null {
	if (!datecode || datecode.length !== 6) return null;
	const year = parseInt(datecode.slice(0, 4));
	const week = parseInt(datecode.slice(4));
	if (isNaN(year) || isNaN(week) || week < 1 || week > 53) return null;
	return { year, week };
}
