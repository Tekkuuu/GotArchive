import type { LayoutServerLoad } from './$types';
import { schema } from '$lib/server/db';
import { db } from '$lib/server/db';
import { eq, sql, sum } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { logger } from '$lib/server/logger';

export const load: LayoutServerLoad = async () => {
	const mainSeason = db.$with('mainSeason').as(
		db
			.select({
				animeId: schema.animeSeason.animeId,
				anilistId: schema.animeSeasonMetadata.anilistId,
				malId: schema.animeSeasonMetadata.malId
			})
			.from(schema.animeSeason)
			.innerJoin(
				schema.animeSeasonMetadata,
				eq(schema.animeSeason.animeSeasonId, schema.animeSeasonMetadata.animeSeasonId)
			)
			.where(eq(schema.animeSeason.sequence, 1))
	);

	const animeEpisodes = db.$with('totalEpisodes').as(
		db
			.select({
				animeId: schema.animeSeason.animeId,
				totalEpisodes: sum(schema.animeSeason.episodes).mapWith(Number).as('totalEpisodes'),
				totalEpisodesWatched:
					sql<number>`sum(${schema.animeSeason.episodeProgress} - cardinality(${schema.animeSeason.skippedEpisodes}))`
						.mapWith(Number)
						.as('totalEpisodesWatched')
			})
			.from(schema.animeSeason)
			.groupBy(schema.animeSeason.animeId)
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
  `;

	try {
		const data = await db
			.with(mainSeason, animeEpisodes)
			.select({
				animeId: schema.anime.animeId,
				titleNative: schema.anime.titleNative,
				titleRomaji: schema.anime.titleRomaji,
				titleEnglish: schema.anime.titleEnglish,
				genres: sql<Array<string>>`ARRAY_AGG(DISTINCT ${schema.genre.name})`,
				links: links,
				totalEpisodes: animeEpisodes.totalEpisodes,
				totalEpisodesWatched: animeEpisodes.totalEpisodesWatched,
				external: sql<{
					anilistId: number | null;
					malId: number | null;
				}>`json_build_object('anilistId', ${mainSeason.anilistId}, 'malId', ${mainSeason.malId})`
			})
			.from(schema.anime)
			.innerJoin(animeEpisodes, eq(animeEpisodes.animeId, schema.anime.animeId))
			.innerJoin(mainSeason, eq(mainSeason.animeId, schema.anime.animeId))
			.innerJoin(schema.animeGenre, eq(schema.anime.animeId, schema.animeGenre.animeId))
			.innerJoin(schema.genre, eq(schema.genre.genreId, schema.animeGenre.genreId))
			.leftJoin(schema.animeLink, eq(schema.animeLink.animeId, schema.anime.animeId))
			.groupBy(
				schema.anime.animeId,
				schema.anime.titleNative,
				schema.anime.titleRomaji,
				schema.anime.titleEnglish,
				mainSeason.anilistId,
				mainSeason.malId,
				animeEpisodes.totalEpisodes,
				animeEpisodes.totalEpisodesWatched
			);

		return { anime: data };
	} catch (err) {
		logger.error('Failed to load anime layout data', {
			error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err)
		});
		throw error(500, 'Failed to load anime data');
	}
};
