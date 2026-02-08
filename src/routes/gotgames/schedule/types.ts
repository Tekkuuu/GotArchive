import type { RawSchedule } from '$lib/hooks';

export type ScheduleEntry = RawSchedule['scheduleEntries'][number];

export type MultiAnimeScheduleEntry =
	| {
			type: 'anime';
			scheduleEntryId: number;
			animeId: number;
			sequence: number;
			titleEnglish: string;
			titleNative: string;
			titleRomaji: string;
			episodes: number[];
			watchedAfter?: Date;
			platformName: string;
			platformUrl: string;
	  }
	| {
			type: 'misc';
			scheduleEntryId: number;
			title: string;
			description: string | null;
			platformName: string;
			platformUrl: string;
	  };

export type ScheduleTypeTimedateGroup = {
	type: string;
	date: string;
	time: string | null;
	entries: MultiAnimeScheduleEntry[];
};

export type WeekdayScheduleGroup = {
	date: string;
	entries: ScheduleTypeTimedateGroup[];
};
