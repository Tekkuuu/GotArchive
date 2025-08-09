import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { schema } from '$lib/server/db';
import { z } from 'zod';
import { error } from '@sveltejs/kit';
import { eq, sql, and, getTableColumns } from 'drizzle-orm';
import type { SeasonData } from './types';

export const load: PageServerLoad = async ({ request, params, locals, url }) => {
  let seasons: SeasonData[] = [];

  const animeId = z.number().positive().safeParse(Number(params.animeId));

  if (!animeId.success || !animeId.data) {
    error(404);
  }

  const seasonEpisodesWatched = db.$with('seasonEpisodesWatched').as(
    db
      .select({
        animeId: schema.animeEpisode.animeId,
        sequence: schema.animeEpisode.sequence,
        watchedInSeason: sql<number>`COUNT(*) FILTER (WHERE ${schema.animeEpisode.watched})`.as('watchedInSeason'),
      })
      .from(schema.animeEpisode)
      .where(eq(schema.animeEpisode.watched, true))
      .groupBy(schema.animeEpisode.animeId, schema.animeEpisode.sequence)
  );

  seasons = await db
    .with(seasonEpisodesWatched)
    .select({
      ...getTableColumns(schema.animeSeason),
      watchedInSeason: sql<number>`COALESCE(${seasonEpisodesWatched.watchedInSeason},0)`.as('watchedInSeason'),
      status: schema.animeSeasonStatusView.status,
    })
    .from(schema.animeSeason)
    .leftJoin(seasonEpisodesWatched, and(
      eq(schema.animeSeason.animeId, seasonEpisodesWatched.animeId),
      eq(schema.animeSeason.sequence, seasonEpisodesWatched.sequence)
    ))
    .innerJoin(schema.animeSeasonStatusView, and(
      eq(schema.animeSeasonStatusView.animeId, schema.animeSeason.animeId),
      eq(schema.animeSeasonStatusView.sequence, schema.animeSeason.sequence)
    ))
    .where(eq(schema.animeSeason.animeId, animeId.data))
    .orderBy(schema.animeSeason.sequence);

  return { seasons: seasons }
}
