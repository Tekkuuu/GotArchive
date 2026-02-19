import { useWatchingWeek } from './useWatchingWeek';
import type * as DB from '$lib/server/db';

export type Schedule = {
	scheduleInfo: DB.Schedule;
	scheduleEntries: ScheduleEntry[];
};

export type WatchingWeek = Awaited<ReturnType<typeof useWatchingWeek>>;

export type ScheduleEntry = {
	scheduleEntry: Omit<DB.ScheduleEntry, 'scheduleId'> & { platformId: string };
	anime?: {
		animeSeasonId: string | null;
		animeId: string | null;
		sequence: number | null;
		titleEnglish: string | null;
		titleNative: string | null;
		titleRomaji: string | null;
		shortTitle: string | null;
		episodes: number | null;
		episodeProgress: number | null;
		logoUrl: string | null;
	} | null;
	misc?: {
		title: string | null;
		description: string | null;
	} | null;
};
