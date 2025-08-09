import type { LayoutServerLoad } from "./$types";
import type { AnimeCard } from './types';
import { schema } from '$lib/server/db';
import { db } from "$lib/server/db";
import { eq, sql, sum } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  let data: AnimeCard[] = [];

  const animeEpisodes = db.$with('animeEpisodes').as(
    db
      .select({
        animeId: schema.animeSeason.animeId,
        totalEpisodes: sum(schema.animeSeason.episodes).as('totalEpisodes'),
      })
      .from(schema.animeSeason)
      .groupBy(schema.animeSeason.animeId)
  );

  const animeEpisodesWatched = db.$with('animeEpisodesWatched').as(
    db
      .select({
        animeId: schema.animeEpisode.animeId,
        totalEpisodesWatched: sql<number>`COUNT(*) FILTER (WHERE ${schema.animeEpisode.watched})`.as('totalEpisodesWatched'),
      })
      .from(schema.animeEpisode)
      .groupBy(schema.animeEpisode.animeId)
  );

  const mainSeason = db.$with('mainSeason').as(
    db.select({
      animeId: schema.animeSeason.animeId,
      anilistLink: schema.animeSeason.anilistLink
    })
      .from(schema.animeSeason)
      .where(eq(schema.animeSeason.sequence, 1))
  );

  const links = sql<Array<[string, string | null]>>`
    COALESCE(
      (
        SELECT json_agg(json_build_array(url, note))
        FROM (
          SELECT DISTINCT ${schema.animeLink.url} as url, ${schema.animeLink.note} as note
          FROM ${schema.animeLink}
          WHERE ${schema.animeLink.animeId} = ${schema.anime.animeId} AND ${schema.animeLink.url} IS NOT NULL
          ORDER BY url, note
        ) sub
      ),
      '[]'
    )
  `

  data = await db
    .with(animeEpisodes, animeEpisodesWatched, mainSeason)
    .select({
      animeId: schema.anime.animeId,
      titleNative: schema.anime.titleNative,
      titleRomaji: schema.anime.titleRomaji,
      titleEnglish: schema.anime.titleEnglish,
      genres: sql<Array<string>>`ARRAY_AGG(DISTINCT ${schema.genre.name})`,
      links: links,
      totalEpisodes: animeEpisodes.totalEpisodes,
      totalEpisodesWatched: sql<number>`COALESCE(${animeEpisodesWatched.totalEpisodesWatched},0)`.as('totalEpisodesWatched'),
      mainSeason: mainSeason.anilistLink
    })
    .from(schema.anime)
    .innerJoin(animeEpisodes, eq(animeEpisodes.animeId, schema.anime.animeId))
    .leftJoin(animeEpisodesWatched, eq(animeEpisodesWatched.animeId, schema.anime.animeId))
    .innerJoin(mainSeason, eq(mainSeason.animeId, schema.anime.animeId))
    .innerJoin(schema.animeGenre, eq(schema.anime.animeId, schema.animeGenre.animeId))
    .innerJoin(schema.genre, eq(schema.genre.genreId, schema.animeGenre.genreId))
    .leftJoin(schema.animeLink, eq(schema.animeLink.animeId, schema.anime.animeId))
    .groupBy(
      schema.anime.animeId,
      schema.anime.titleNative,
      schema.anime.titleRomaji,
      schema.anime.titleEnglish,
      mainSeason.anilistLink,
      animeEpisodes.totalEpisodes,
      animeEpisodesWatched.totalEpisodesWatched
    )

  return { anime: data }
}
