import { db } from '$lib/server/db';
import { eq, and, sql } from 'drizzle-orm';
import { schema, services } from '$lib/server/db';
import type * as DB from '$lib/server/db';
import type { ScheduleEntry } from './types';
import _ from 'lodash';

/**
 * Retrieves schedule information and its entries for a given `datecode`.
 *
 * This function queries the database for a schedule matching the specified year and ISO week,
 * joining related tables to collect schedule metadata and associated entries, including anime and platform details.
 *
 * If the `datecode` is invalid or no schedule is found, it returns `scheduleInfo` as `undefined` and an empty `scheduleEntries` array.
 *
 * @param datecode - A string in `YYYYWW` format, where:
 *   - `YYYY` is the 4-digit year
 *   - `WW` is the ISO week number (1–53)
 * @returns An object with:
 *   - `scheduleInfo`: Metadata about the schedule (scheduleId, year, week, note), or `undefined` if not found
 *   - `scheduleEntries`: Array of entries with datetime, note, platform, and anime details
 *
 * @example
 * // Fetch schedule for year 2025, week 18
 * const result = await useSchedule("202518");
 * console.log(result.scheduleInfo); // { year: 2025, week: 18 }
 * console.log(result.scheduleEntries); // [{ datetime: ..., note: ..., platform: ..., anime: ... }, ...]
 *
 * @example
 * // Handle invalid datecode
 * try {
 *   await useSchedule("20A518");
 * } catch (error) {
 *   console.error(error.message); // "Invalid datecode"
 * }
 */
export async function useSchedule(
  datecode: string,
  options?: { watchedAfter?: boolean }
): Promise<{
  scheduleInfo: DB.Schedule | undefined;
  scheduleEntries: ScheduleEntry[]
}> {
  // Check if id has a vaild structure
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

  type AnimeSelect = {
    animeId: typeof schema.animeSeason.animeId;
    sequence: typeof schema.animeSeason.sequence;
    titleEnglish: typeof schema.animeSeason.titleEnglish;
    titleNative: typeof schema.animeSeason.titleNative;
    titleRomaji: typeof schema.animeSeason.titleRomaji;
    episodes: ReturnType<typeof sql<Array<number>>>;
    watchedAfter?: typeof schema.scheduleAnimeDetail.watchedAfter;
  };

  type MiscSelect = {
    title: typeof schema.scheduleMiscDetail.title;
    description: typeof schema.scheduleMiscDetail.description;
  };

  let animeSelect: AnimeSelect = {
    animeId: schema.animeSeason.animeId,
    sequence: schema.animeSeason.sequence,
    titleEnglish: schema.animeSeason.titleEnglish,
    titleNative: schema.animeSeason.titleNative,
    titleRomaji: schema.animeSeason.titleRomaji,
    episodes: sql<Array<number>>`ARRAY_AGG(${schema.animeEpisode.episodeNumber} ORDER BY ${schema.animeEpisode.episodeNumber})`,
  };

  let miscSelect: MiscSelect = {
    title: schema.scheduleMiscDetail.title,
    description: schema.scheduleMiscDetail.description,
  };

  if (options?.watchedAfter) {
    _.set(animeSelect, 'watchedAfter', schema.scheduleAnimeDetail.watchedAfter);
  }

  const scheduleInfo = _.head(
    _.sortBy(
      (await services.schedule.select(db, and(eq(schema.schedule.year, year), eq(schema.schedule.week, week)))),
      ['year', 'week'], ['desc', 'desc']
    )
  );

  if (scheduleInfo === undefined) {
    // Cannot find schedule entry in the database, reutrn empty result
    return { scheduleInfo: undefined, scheduleEntries: [] };
  }

  let result = await db
    .select({
      scheduleEntry: {
        scheduleEntryId: schema.scheduleEntry.scheduleEntryId,
        type: schema.scheduleEntry.type,
        date: schema.scheduleEntry.date,
        time: schema.scheduleEntry.time,
        note: schema.scheduleEntry.note,
        platformId: schema.scheduleEntryPlatform.platformId,
      },
      anime: animeSelect,
      misc: miscSelect,
    })
    .from(schema.scheduleEntry)
    .innerJoin(schema.scheduleEntryPlatform, eq(schema.scheduleEntryPlatform.scheduleEntryId, schema.scheduleEntry.scheduleEntryId))
    .leftJoin(schema.scheduleAnimeDetail, eq(schema.scheduleAnimeDetail.scheduleEntryId, schema.scheduleEntry.scheduleEntryId))
    .leftJoin(schema.scheduleAnimeEpisode, eq(schema.scheduleAnimeEpisode.scheduleAnimeDetailId, schema.scheduleAnimeDetail.scheduleAnimeDetailId))
    .leftJoin(schema.animeEpisode, eq(schema.animeEpisode.animeEpisodeId, schema.scheduleAnimeEpisode.animeEpisodeId))
    .leftJoin(schema.animeSeason, and(eq(schema.animeSeason.animeId, schema.animeEpisode.animeId), eq(schema.animeSeason.sequence, schema.animeEpisode.sequence)))
    .leftJoin(schema.scheduleMiscDetail, eq(schema.scheduleMiscDetail.scheduleEntryId, schema.scheduleEntry.scheduleEntryId))
    .where(eq(schema.scheduleEntry.scheduleId, scheduleInfo.scheduleId))
    .groupBy(
      schema.scheduleEntry.scheduleEntryId,
      schema.scheduleEntry.type,
      schema.scheduleEntry.date,
      schema.scheduleEntry.time,
      ...(options?.watchedAfter ? [schema.scheduleAnimeDetail.watchedAfter] : []),
      schema.scheduleEntryPlatform.platformId,
      schema.animeSeason.animeId,
      schema.animeSeason.sequence,
      schema.animeSeason.titleEnglish,
      schema.animeSeason.titleNative,
      schema.animeSeason.titleRomaji,
      schema.scheduleMiscDetail.title,
      schema.scheduleMiscDetail.description
    )
    .orderBy(schema.scheduleEntry.date, schema.scheduleEntry.time, schema.animeSeason.animeId, schema.animeSeason.sequence)

  return { scheduleInfo: scheduleInfo, scheduleEntries: result };
};
