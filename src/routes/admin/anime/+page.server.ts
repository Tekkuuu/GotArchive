import type { PageServerLoad } from './$types';
import {
	db,
	schema,
	type AnimeLink,
	type AnimeSeason,
	type AnimeSeasonMetadata,
	type Genre
} from '$lib/server/db';
import { eq, sql } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	// FILTER+coalesce yields [] when no rows; without it null-object rows survive array_remove.
	const anime = await db
		.select({
			series: schema.anime,
			genres: sql<Array<Genre>>`
			coalesce(
				array_remove(
					array_agg(distinct json_build_object('genreId', ${schema.genre.genreId}, 'name', ${schema.genre.name})::jsonb)
						FILTER (WHERE ${schema.genre.genreId} IS NOT NULL),
					null
				),
				'{}'::jsonb[]
			)
		`.as('genres'),
			links: sql<Array<AnimeLink>>`
      coalesce(
        array_remove(
          array_agg(distinct json_build_object(
            'url', ${schema.animeLink.url},
            'platformId', ${schema.animeLink.platformId},
            'note', ${schema.animeLink.note}
          )::jsonb)
            FILTER (WHERE ${schema.animeLink.url} IS NOT NULL),
          null
        ),
        '{}'::jsonb[]
      )
      `.as('links'),
			seasons: sql<Array<AnimeSeason & Omit<AnimeSeasonMetadata, 'animeSeasonId'>>>`
			coalesce(
				array_remove(
					array_agg(
						distinct json_build_object(
							'animeSeasonId', ${schema.animeSeason.animeSeasonId},
							'sequence', ${schema.animeSeason.sequence},
							'format', ${schema.animeSeason.format},
							'titleNative', ${schema.animeSeason.titleNative},
							'titleRomaji', ${schema.animeSeason.titleRomaji},
							'titleEnglish', ${schema.animeSeason.titleEnglish},
							'shortTitle', ${schema.animeSeason.shortTitle},
							'season', ${schema.animeSeason.season},
							'year', ${schema.animeSeason.year},
							'episodes', ${schema.animeSeason.episodes},
							'episodeProgress', ${schema.animeSeason.episodeProgress},
              'anilistId', ${schema.animeSeasonMetadata.anilistId},
              'malId', ${schema.animeSeasonMetadata.malId},
              'note', ${schema.animeSeasonMetadata.note}
						)::jsonb
					)
						FILTER (WHERE ${schema.animeSeason.animeSeasonId} IS NOT NULL),
					null
				),
				'{}'::jsonb[]
			)
		`.as('seasons')
		})
		.from(schema.anime)
		.leftJoin(schema.animeLink, eq(schema.anime.animeId, schema.animeLink.animeId))
		.leftJoin(schema.animeGenre, eq(schema.anime.animeId, schema.animeGenre.animeId))
		.leftJoin(schema.genre, eq(schema.animeGenre.genreId, schema.genre.genreId))
		.leftJoin(schema.animeSeason, eq(schema.anime.animeId, schema.animeSeason.animeId))
		.leftJoin(
			schema.animeSeasonMetadata,
			eq(schema.animeSeason.animeSeasonId, schema.animeSeasonMetadata.animeSeasonId)
		)
		.groupBy(schema.anime.animeId);

	const genres = await db.select().from(schema.genre);
	const platforms = await db.select().from(schema.platform);

	return { anime, genres, platforms };
};
