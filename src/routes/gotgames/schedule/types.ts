import type { ScheduleEntryData, ScheduleMetadata } from '$lib/api/schedule/datecode';
import type { IsoWeekDateRange, TimezoneAdjustedEntry } from '$lib/api/schedule/datecode';

/**
 * Entries grouped by weekday
 * Key: 0-6 (Monday to Sunday)
 * Value: Array of entries for that day
 */
export type EntriesByWeekday = Map<number, TimezoneAdjustedEntry[]>;

/**
 * Page load data structure - schedule can be null if week not found
 */
export interface SchedulePageData {
	schedule: ScheduleMetadata | null;
	weekRange: string;
	/** Inclusive Monday–Sunday date bounds of the displayed ISO week (UTC). */
	weekDateRange: IsoWeekDateRange;
	entries: ScheduleEntryData[];
	/** Entries from the prev/next ISO weeks for cross-week timezone shifting. */
	adjacentEntries: ScheduleEntryData[];
	currentYear: number;
	currentWeek: number;
}
