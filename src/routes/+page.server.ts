import type { PageServerLoad } from './$types';
import { db, schema } from '$lib/server/db';
import { useWatchingWeek } from '$lib/hooks';
import { getISOWeek } from 'date-fns';
import { sql } from 'drizzle-orm';
import { logger } from '$lib/server/logger';

export const load: PageServerLoad = async () => {
	let totalAnime: number = 0;
	let totalEpisodesWatched: number = 0;
	let watching: Awaited<ReturnType<typeof useWatchingWeek>> = [];
	const errors: string[] = [];

	try {
		const anime = await db.select().from(schema.anime);
		totalAnime = anime.length;
	} catch (err) {
		logger.error('Failed to fetch total anime count', {
			source: 'homePage',
			error: err instanceof Error ? err.message : String(err)
		});
		errors.push('Failed to load anime statistics');
	}

	try {
		const [result] = await db
			.select({ total: sql<number>`sum(${schema.animeSeason.episodeProgress})` })
			.from(schema.animeSeason);
		totalEpisodesWatched = result?.total ?? 0;
	} catch (err) {
		logger.error('Failed to fetch total episodes watched', {
			source: 'homePage',
			error: err instanceof Error ? err.message : String(err)
		});
		errors.push('Failed to load episode statistics');
	}

	try {
		const date = new Date();
		const year = date.getFullYear();
		const week = getISOWeek(date);
		const datecode = `${year}${week < 10 ? '0' + week.toString() : week}`;
		watching = await useWatchingWeek(datecode);
	} catch (err) {
		logger.error('Failed to fetch watching week data', {
			source: 'homePage',
			error: err instanceof Error ? err.message : String(err)
		});
		errors.push('Failed to load weekly schedule');
	}

	return { totalAnime, totalEpisodesWatched, watching, errors };
};
