import type { IsoWeekDateRange } from '../timezone';

/**
 * API Types for Schedule Datecode Endpoint
 * Used by /api/schedule/[datecode] and public schedule page
 */

export interface ScheduleAnimeInfo {
	animeId: string;
	titleNative: string;
	titleRomaji: string | null;
	titleEnglish: string | null;
	shortTitle: string | null;
	logoUrl: string | null;
}

export interface ScheduleAnimeSeasonInfo {
	animeSeasonId: string;
	episodes: string; // e.g., "1-4", "10-12"
	anime: ScheduleAnimeInfo;
	format: string;
	season: string | null;
	year: number | null;
	titleNative: string;
	titleRomaji: string | null;
	titleEnglish: string | null;
	shortTitle: string | null;
}

export interface SchedulePlatformInfo {
	platformId: string;
	name: string;
	url: string;
}

export interface ScheduleEntryData {
	scheduleEntryId: string;
	date: string; // ISO date format "YYYY-MM-DD"
	dayOfWeek: number; // 0=Monday, 6=Sunday (adjusted from DB 0=Sunday)
	time: string | null; // "HH:MM:SS" or null
	type: 'anime' | 'hololive' | 'game' | 'event' | 'sponsored' | 'misc';
	title: string | null;
	description: string | null;
	logoUrl: string | null;
	note: string | null;
	isCancelled: boolean;
	cancelledText: string | null;
	animeSeasons: ScheduleAnimeSeasonInfo[];
	platforms: SchedulePlatformInfo[];
}

export interface ScheduleMetadata {
	scheduleId: string;
	year: number;
	week: number;
	note: string | null;
	preview: boolean;
}

export interface ScheduleData {
	schedule: ScheduleMetadata;
	weekRange: string; // e.g., "Week 8, 17-23 February"
	/** Inclusive Monday–Sunday date bounds of this ISO week (UTC). */
	weekDateRange: IsoWeekDateRange;
	entries: ScheduleEntryData[];
	/**
	 * Entries from the immediately preceding and following ISO weeks.
	 * Used by views that apply a timezone offset: an entry from an adjacent
	 * week can shift into this week after conversion, and an entry from this
	 * week can shift out of it.
	 */
	adjacentEntries: ScheduleEntryData[];
}

// API Response wrapper
export interface ScheduleApiSuccessResponse {
	success: true;
	data: ScheduleData;
}

export interface ScheduleApiErrorResponse {
	success: false;
	error: string;
}

export type ScheduleApiResponse = ScheduleApiSuccessResponse | ScheduleApiErrorResponse;
