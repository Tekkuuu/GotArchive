import { schema } from '.';
import { createService } from './shared/serviceFactory';
import { withErrorOrigin } from './shared/util';
import { idConfig } from './idConfig';
import * as z from 'zod';
import { PgTransaction } from 'drizzle-orm/pg-core';
import { parseEpisodeRange } from '$lib/util/schedule/episodeProgressParser';

export const services = {
	anime: withErrorOrigin(
		createService(
			schema.anime,
			'anime',
			idConfig(z.object({ animeId: z.string().uuid() }), {
				animeId: schema.anime.animeId
			})
		),
		'animeService'
	),
	animeGenre: withErrorOrigin(
		createService(
			schema.animeGenre,
			'anime_genre',
			idConfig(
				z.object({
					animeId: z.string().uuid(),
					genreId: z.string().uuid()
				}),
				{
					animeId: schema.animeGenre.animeId,
					genreId: schema.animeGenre.genreId
				}
			)
		),
		'animeGenreService'
	),
	animeLink: withErrorOrigin(
		createService(
			schema.animeLink,
			'anime_link',
			idConfig(
				z.object({
					animeId: z.string().uuid(),
					url: z.string().url()
				}),
				{
					animeId: schema.animeLink.animeId,
					url: schema.animeLink.url
				}
			)
		),
		'animeLinkService'
	),
	animeSeason: withErrorOrigin(
		createService(
			schema.animeSeason,
			'anime_season',
			idConfig(z.object({ animeSeasonId: z.string().uuid() }), {
				animeSeasonId: schema.animeSeason.animeSeasonId
			})
		),
		'animeSeasonService'
	),
	genre: withErrorOrigin(
		createService(
			schema.genre,
			'genre',
			idConfig(z.object({ genreId: z.string().uuid() }), {
				genreId: schema.genre.genreId
			})
		),
		'genreService'
	),
	platform: withErrorOrigin(
		createService(
			schema.platform,
			'platform',
			idConfig(z.object({ platformId: z.string().uuid() }), {
				platformId: schema.platform.platformId
			})
		),
		'platformService'
	),
	schedule: withErrorOrigin(
		createService(
			schema.schedule,
			'schedule',
			idConfig(z.object({ scheduleId: z.string().uuid() }), {
				scheduleId: schema.schedule.scheduleId
			})
		),
		'scheduleService'
	),
	scheduleEntry: withErrorOrigin(
		createService(
			schema.scheduleEntry,
			'schedule_entry',
			idConfig(z.object({ scheduleEntryId: z.string().uuid() }), {
				scheduleEntryId: schema.scheduleEntry.scheduleEntryId
			}),
			{
				insert: async (tx: PgTransaction<any, any, any>, data: any): Promise<any[]> => {
					const inserted = await services.scheduleEntry.insert(tx, data);
					for (const item of inserted) {
						if (item.animeSeasonId && item.description) {
							const progress = parseEpisodeRange(item.description);
							if (progress !== null) {
								await services.animeSeason.update(
									tx,
									{ episodeProgress: progress },
									{ animeSeasonId: item.animeSeasonId }
								);
							}
						}
					}
					return inserted;
				}
			}
		),
		'scheduleEntryService'
	),
	scheduleEntryPlatform: withErrorOrigin(
		createService(
			schema.scheduleEntryPlatform,
			'schedule_entry_platform',
			idConfig(
				z.object({
					scheduleEntryId: z.string().uuid(),
					platformId: z.string().uuid()
				}),
				{
					scheduleEntryId: schema.scheduleEntryPlatform.scheduleEntryId,
					platformId: schema.scheduleEntryPlatform.platformId
				}
			)
		),
		'scheduleEntryPlatformService'
	)
};
