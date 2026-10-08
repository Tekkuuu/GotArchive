import type { PageServerLoad } from './$types';
import { schema, db, eq, sql, asc, and } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const { datecode } = params;

	if (datecode.length !== 6) {
		throw error(400, 'Invalid datecode format');
	}

	const year = parseInt(datecode.slice(0, 4));
	const week = parseInt(datecode.slice(4));

	if (isNaN(year) || isNaN(week) || week < 1 || week > 53) {
		throw error(400, 'Invalid year or week');
	}

	const [scheduleData] = await db
		.select()
		.from(schema.schedule)
		.where(and(eq(schema.schedule.year, year), eq(schema.schedule.week, week)))
		.limit(1);

	if (!scheduleData) {
		throw error(404, 'Schedule not found');
	}

	const entryAnime = db.$with('entry_anime').as(
		db
			.select({
				scheduleEntryId: schema.scheduleEntry.scheduleEntryId,
				animeSeasons: sql<Array<{ animeSeasonId: string; episodes: string }> | null>`json_agg(
          json_build_object(
            'animeSeasonId', ${schema.scheduleEntryAnimeSeason.animeSeasonId},
            'episodes', ${schema.scheduleEntryAnimeSeason.episodes}
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
			.where(eq(schema.scheduleEntry.scheduleId, scheduleData.scheduleId))
			.groupBy(schema.scheduleEntry.scheduleEntryId)
	);

	const entryPlatforms = db.$with('entry_platforms').as(
		db
			.select({
				scheduleEntryId: schema.scheduleEntry.scheduleEntryId,
				platforms: sql<Array<string> | null>`array_agg(
          ${schema.scheduleEntryPlatform.platformId}
          ORDER BY ${schema.scheduleEntryPlatform.platformId}
        ) FILTER (WHERE ${schema.scheduleEntryPlatform.platformId} IS NOT NULL)`.as('platforms')
			})
			.from(schema.scheduleEntry)
			.leftJoin(
				schema.scheduleEntryPlatform,
				eq(schema.scheduleEntry.scheduleEntryId, schema.scheduleEntryPlatform.scheduleEntryId)
			)
			.where(eq(schema.scheduleEntry.scheduleId, scheduleData.scheduleId))
			.groupBy(schema.scheduleEntry.scheduleEntryId)
	);

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
		.where(eq(schema.scheduleEntry.scheduleId, scheduleData.scheduleId));

	const animeSeasons = await db.select().from(schema.animeSeason);

	const platforms = await db.select().from(schema.platform).orderBy(asc(schema.platform.name));

	return {
		schedule: scheduleData,
		entries,
		animeSeasons,
		platforms
	};
};
