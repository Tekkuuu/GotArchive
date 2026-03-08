import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { schema } from '$lib/server/db';
import { z } from 'zod/v4';
import { error } from '@sveltejs/kit';
import { eq, getTableColumns, sql } from 'drizzle-orm';
import type { SeasonData } from './types';

export const load: PageServerLoad = async ({ params, parent }) => {
	const animeIdParam = z.uuid().safeParse(params.animeId);

	if (!animeIdParam.success) {
		error(404, 'Anime not found');
	}

	// Get parent data to access anime list
	const { anime } = await parent();

	// Check if anime exists in parent data
	const animeExists = anime.find((a) => a.animeId === animeIdParam.data);
	if (!animeExists) {
		error(404, 'Anime not found');
	}

	// Load seasons for this anime with metadata
	const seasonsRaw = await db
		.select({
			...getTableColumns(schema.animeSeason),
			animeSeasonMetadataId: schema.animeSeasonMetadata.animeSeasonMetadataId,
			anilistId: schema.animeSeasonMetadata.anilistId,
			malId: schema.animeSeasonMetadata.malId,
			note: schema.animeSeasonMetadata.note
		})
		.from(schema.animeSeason)
		.leftJoin(
			schema.animeSeasonMetadata,
			eq(schema.animeSeason.animeSeasonId, schema.animeSeasonMetadata.animeSeasonId)
		)
		.where(eq(schema.animeSeason.animeId, sql`${animeIdParam.data}::uuid`))
		.orderBy(schema.animeSeason.sequence);

	// Compute status for each season
	const seasons = seasonsRaw.map((row) => {
		const progress = row.episodeProgress ?? 0;
		const total = row.episodes ?? 0;

		let status = 'Planning';
		if (progress === 0) {
			status = 'Planning';
		} else if (total > 0 && progress >= total) {
			status = 'Completed';
		} else if (progress > 0) {
			status = 'Watching';
		}

		return {
			...row,
			status
		} as SeasonData;
	});

	return { seasons };
};
