import { db } from '$lib/server/db';
import { eq, and, sql } from 'drizzle-orm';
import { schema, services } from '$lib/server/db';

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
  datecode: string
) {
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

  let result = await db
    .select({
      scheduleEntry: {
        id: schema.scheduleEntry.scheduleEntryId,
        type: schema.scheduleEntry.type,
        date: schema.scheduleEntry.date,
        time: schema.scheduleEntry.time,
        note: schema.scheduleEntry.note,
      },
      anime: {
        animeId: schema.animeSeason.animeId,
        sequence: schema.animeSeason.sequence,
        titleEnglish: schema.animeSeason.titleEnglish,
        titleNative: schema.animeSeason.titleNative,
        titleRomaji: schema.animeSeason.titleRomaji,
        episodes: sql<Array<number>>`ARRAY_AGG(${schema.animeEpisode.episodeNumber} ORDER BY ${schema.animeEpisode.episodeNumber})`,
        platformName: schema.platform.name,
        platformUrl: schema.platform.url,
      }
    })
    .from(schema.scheduleEntry)
    .innerJoin(schema.platform, eq(schema.platform.platformId, schema.scheduleEntry.platformId))
    .innerJoin(schema.scheduleAnimeDetail, eq(schema.scheduleAnimeDetail.scheduleEntryId, schema.scheduleEntry.scheduleEntryId))
    .innerJoin(schema.scheduleAnimeEpisode, eq(schema.scheduleAnimeEpisode.scheduleAnimeDetailId, schema.scheduleAnimeDetail.scheduleAnimeDetailId))
    .innerJoin(schema.animeEpisode, eq(schema.animeEpisode.animeEpisodeId, schema.scheduleAnimeEpisode.animeEpisodeId))
    .innerJoin(schema.animeSeason, and(eq(schema.animeSeason.animeId, schema.animeEpisode.animeId), eq(schema.animeSeason.sequence, schema.animeEpisode.sequence)))
    .innerJoin(schema.schedule, eq(schema.schedule.scheduleId, schema.scheduleEntry.scheduleId))
    .where(and(eq(schema.schedule.year, year), eq(schema.schedule.week, week)))
    .groupBy(
      schema.scheduleEntry.scheduleEntryId,
      schema.scheduleEntry.type,
      schema.scheduleEntry.date,
      schema.scheduleEntry.time,
      schema.platform.name,
      schema.platform.url,
      schema.animeSeason.animeId,
      schema.animeSeason.sequence,
      schema.animeSeason.titleEnglish,
      schema.animeSeason.titleNative,
      schema.animeSeason.titleRomaji,
    )
    .orderBy(schema.scheduleEntry.date, schema.scheduleEntry.time, schema.animeSeason.animeId, schema.animeSeason.sequence)

  const scheduleInfo = await services.schedule.select(
    db,
    and(eq(schema.schedule.year, year), eq(schema.schedule.week, week))
  );

  return { scheduleInfo: scheduleInfo?.[0] || { scheduleId: -1, week, year, note: null }, scheduleEntries: result };
};
