import type { PageServerLoad } from './$types';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { z } from 'zod/v4';

export const load: PageServerLoad = async ({ params }) => {
	// Reject non-UUID to avoid PG cast 500.
	const parsed = z.uuid().safeParse(params.seriesId);
	if (!parsed.success) {
		throw error(404, 'Anime not found');
	}

	const seriesId = parsed.data;

	const anime = await db
		.select()
		.from(schema.anime)
		.where(eq(schema.anime.animeId, seriesId))
		.limit(1);

	if (anime.length === 0) {
		throw error(404, 'Anime not found');
	}

	const seasons = await db
		.select({
			data: schema.animeSeason,
			metadata: schema.animeSeasonMetadata
		})
		.from(schema.animeSeason)
		.leftJoin(
			schema.animeSeasonMetadata,
			eq(schema.animeSeasonMetadata.animeSeasonId, schema.animeSeason.animeSeasonId)
		)
		.where(eq(schema.animeSeason.animeId, seriesId))
		.orderBy(schema.animeSeason.sequence);

	return {
		anime: anime[0],
		seasons
	};
};
