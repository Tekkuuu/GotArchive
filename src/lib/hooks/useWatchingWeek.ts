import { schema, db } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import _ from 'lodash';

export async function useWatchingWeek(datecode: string) {
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

  const watchingRaw = await db
    .select({
      animeId: schema.animeSeason.animeId,
      sequence: schema.animeSeason.sequence,
      titles: {
        native: schema.animeSeason.titleNative,
        romaji: schema.animeSeason.titleRomaji,
        english: schema.animeSeason.titleEnglish
      },
      episodeNumber: schema.animeEpisode.episodeNumber,
      date: schema.scheduleEntry.date,
      time: schema.scheduleEntry.time,
      anilistLink: schema.animeSeason.anilistLink,
    })
    .from(schema.schedule)
    .innerJoin(
      schema.scheduleEntry,
      eq(schema.schedule.scheduleId, schema.scheduleEntry.scheduleId)
    )
    .innerJoin(
      schema.scheduleAnimeDetail,
      eq(schema.scheduleEntry.scheduleEntryId, schema.scheduleAnimeDetail.scheduleEntryId)
    )
    .innerJoin(
      schema.scheduleAnimeEpisode,
      eq(schema.scheduleAnimeDetail.scheduleAnimeDetailId, schema.scheduleAnimeEpisode.scheduleAnimeDetailId)
    )
    .innerJoin(
      schema.animeEpisode,
      eq(schema.scheduleAnimeEpisode.animeEpisodeId, schema.animeEpisode.animeEpisodeId)
    )
    .innerJoin(
      schema.animeSeason,
      and(
        eq(schema.animeSeason.animeId, schema.animeEpisode.animeId),
        eq(schema.animeSeason.sequence, schema.animeEpisode.sequence)
      )
    )
    .where(and(
      eq(schema.schedule.year, year),
      eq(schema.schedule.week, week)
    ))
    .orderBy(
      schema.scheduleEntry.date,
      schema.scheduleEntry.time,
      schema.animeSeason.animeId,
      schema.animeSeason.sequence,
      schema.animeEpisode.episodeNumber
    );

  const grouped = _.groupBy(watchingRaw, (item) => `${item.animeId}-${item.sequence}`);

  const watching = Object.values(grouped).map((episodes) => {
    const first = episodes[0];

    const uniqueEpisodes = _.uniqBy(episodes, 'episodeNumber');
    const sortedUniqueEpisodes = _.sortBy(uniqueEpisodes, 'episodeNumber');

    return {
      animeId: first.animeId,
      sequence: first.sequence,
      titles: first.titles,
      episodes: sortedUniqueEpisodes.map((e) => e.episodeNumber),
      anilistLink: first.anilistLink
    };
  });

  return watching;
}
